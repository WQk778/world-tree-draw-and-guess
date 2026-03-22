<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../lib/supabase'
import { friendService } from '../services/friendService'
import { messageService } from '../services/messageService'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roomId = route.params.id
const room = ref(null)
const members = ref([])
const currentRound = ref(null)
const currentDrawing = ref(null)
const guessLogs = ref([])

const loading = ref(true)
const isSubmitting = ref(false)
const guessInput = ref('')
const myGuessResult = ref(null) // { isCorrect: boolean, points: number }

// Subscriptions
let roomSub = null
let roundSub = null
let guessSub = null
let drawingSub = null

// Canvas State
const canvasRef = ref(null)
const isDrawing = ref(false)
const ctx = ref(null)
const currentColor = ref('#000000')
const currentLineWidth = ref(4)

// Invite State
const showInviteModal = ref(false)
const friendsList = ref([])
const isInviting = ref(false)

// Computed
const isOwner = computed(() => room.value?.owner_id === userStore.user?.id)
const isDrawer = computed(() => currentRound.value?.drawer_id === userStore.user?.id)
const gamePhase = computed(() => {
    if (!room.value || room.value.status === 'waiting') return 'waiting'
    if (currentRound.value?.status === 'drawing') return 'drawing'
    if (currentRound.value?.status === 'guessing') return 'guessing'
    if (currentRound.value?.status === 'finished') return 'finished'
    return 'waiting'
})

// --- Data Fetching ---

const fetchRoomData = async () => {
  try {
    // 1. Fetch Room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    if (roomError) throw roomError
    room.value = roomData

    // 2. Fetch Members
    await fetchMembers()

    // 3. Fetch Active Round (if playing)
    if (roomData.status === 'playing') {
        await fetchActiveRound()
    }
  } catch (error) {
    console.error('Error fetching room:', error)
    alert('无法加载房间信息')
    router.push('/lobby')
  } finally {
    loading.value = false
  }
}

const fetchMembers = async () => {
    const { data: membersData, error } = await supabase
      .from('room_members')
      .select(`*, profiles (nickname, avatar_url, total_points)`)
      .eq('room_id', roomId)
      .order('joined_at')
    
    if (!error) members.value = membersData
}

const fetchActiveRound = async () => {
    const { data: rounds } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
    
    if (rounds && rounds.length > 0) {
        currentRound.value = rounds[0]
        
        // If guessing or finished, fetch drawing
        if (currentRound.value.status === 'guessing' || currentRound.value.status === 'finished') {
            await fetchDrawingForRound(currentRound.value.id)
        }
    }
}

const fetchDrawingForRound = async (roundId, retries = 3) => {
    const { data: drawing } = await supabase
        .from('drawings')
        .select('*')
        .eq('round_id', roundId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    
    if (drawing) {
        currentDrawing.value = drawing
        // Now we can fetch guesses for this drawing
        await fetchGuessLogs(drawing.id)
    } else if (retries > 0) {
        console.log(`Drawing not found for round ${roundId}, retrying... (${retries} left)`)
        setTimeout(() => fetchDrawingForRound(roundId, retries - 1), 1000)
    }
}

const fetchGuessLogs = async (drawingId) => {
    if (!drawingId) return
    const { data: guesses } = await supabase
        .from('guess_records')
        .select(`*, profiles(nickname)`)
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: true })
    
    if (guesses) guessLogs.value = guesses
    
    // Check if I already guessed correctly
    const myCorrect = guesses?.find(g => g.user_id === userStore.user?.id && g.is_correct)
    if (myCorrect) {
        myGuessResult.value = { isCorrect: true, points: myCorrect.points_earned }
    } else {
        myGuessResult.value = null
    }
}

// --- Realtime ---

const setupRealtime = () => {
  // 1. Room & Members
  roomSub = supabase
    .channel(`room_main:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, fetchMembers)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        room.value = payload.new
        if (payload.new.status === 'playing') fetchActiveRound()
    })
    .subscribe()

  // 2. Game Rounds
  roundSub = supabase
    .channel(`room_rounds:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rounds', filter: `room_id=eq.${roomId}` }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const oldRoundId = currentRound.value?.id
            currentRound.value = payload.new
            
            // If it's a new round, clear previous guesses
            if (payload.eventType === 'INSERT' || (oldRoundId && oldRoundId !== payload.new.id)) {
                guessLogs.value = []
                myGuessResult.value = null
                currentDrawing.value = null
            }

            if (payload.new.status === 'guessing') {
                // Wait a bit for drawing to be inserted
                setTimeout(() => fetchDrawingForRound(payload.new.id), 500)
            }
        }
    })
    .subscribe()

  // 3. Guesses (Global for this room's drawings? hard to filter complex joins)
  // We'll listen to guess_records and filter client side if needed or rely on drawing_id
  guessSub = supabase
    .channel(`room_guesses:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guess_records' }, async (payload) => {
        if (currentDrawing.value && payload.new.drawing_id === currentDrawing.value.id) {
            // Fetch profile for nickname
            const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', payload.new.user_id).single()
            const newLog = { ...payload.new, profiles: profile }
            guessLogs.value.push(newLog)
            
            // Update member points if correct
            if (payload.new.is_correct) fetchMembers()
        }
    })
    .subscribe()

  // 4. Drawings
  drawingSub = supabase
    .channel(`room_drawings:${roomId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drawings' }, (payload) => {
        if (currentDrawing.value && payload.new.id === currentDrawing.value.id) {
            currentDrawing.value = payload.new
        }
    })
    .subscribe()
}

// --- Game Logic ---

const startGame = async () => {
    if (isSubmitting.value) return
    if (members.value.length < 2) {
        alert('房间内至少需要2名玩家才能开始游戏！')
        return
    }
    isSubmitting.value = true
    try {
        // 1. Update Room Status
        const { error: err1 } = await withTimeout(supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId))
        if (err1) throw err1

        // 2. Create First Round
        // Pick random drawer
        const drawer = members.value[Math.floor(Math.random() * members.value.length)]
        // Pick random word (Mock)
        const words = ['猫咪', '火箭', '程序员', '外星人', '冰淇淋', '电脑', '自行车', '太阳']
        const targetWord = words[Math.floor(Math.random() * words.length)]

        const { error: err2 } = await withTimeout(supabase.from('game_rounds').insert({
            room_id: roomId,
            drawer_id: drawer.user_id,
            target_word: targetWord,
            round_number: 1,
            status: 'drawing'
        }))
        if (err2) throw err2

    } catch (error) {
        console.error('Start game error:', error)
        alert(`启动游戏失败: ${error.message}`)
    } finally {
        isSubmitting.value = false
    }
}

const leaveRoom = async () => {
  await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userStore.user.id)
  router.push('/lobby')
}

// --- Invite Friends ---
const openInviteModal = async () => {
  showInviteModal.value = true
  try {
    friendsList.value = await friendService.getFriends()
  } catch (error) {
    console.error('Error fetching friends:', error)
  }
}

const getFriendProfile = (friendRecord) => {
  return friendRecord.requester_id === userStore.user.id 
    ? friendRecord.addressee 
    : friendRecord.requester
}

const inviteFriend = async (friendId) => {
  if (isInviting.value || !room.value) return
  isInviting.value = true
  try {
    await messageService.sendRoomInvite(friendId, room.value.code)
    alert('邀请已发送')
  } catch (error) {
    alert('发送邀请失败')
  } finally {
    isInviting.value = false
  }
}

// --- Drawing Logic ---

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  // Get computed style to handle responsive width/height
  const rect = canvas.getBoundingClientRect()
  // Adjust for device pixel ratio for sharp rendering on retina displays
  const dpr = window.devicePixelRatio || 1
  
  // Important: Check if dimensions are valid before setting
  if (rect.width === 0 || rect.height === 0) {
      // If canvas isn't fully rendered yet, retry in next frame
      setTimeout(initCanvas, 50)
      return
  }

  // Set the actual DOM element dimensions
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  ctx.value = canvas.getContext('2d')
  // Scale the context to ensure correct drawing coordinates
  ctx.value.scale(dpr, dpr)
  
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.strokeStyle = currentColor.value
  ctx.value.lineWidth = currentLineWidth.value
  
  // Fill with white background initially (prevents transparent background issues on save)
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, rect.width, rect.height)

  // Try to restore draft if exists
  restoreDraft()
}

// --- Local Draft Logic ---
const SAVE_KEY = computed(() => `draft:drawing:${roomId}:${currentRound.value?.id || 'unknown'}`)

const throttle = (fn, wait = 800) => {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

const saveDraft = () => {
  if (!canvasRef.value || !isDrawer.value) return
  const dataUrl = canvasRef.value.toDataURL('image/png')
  localStorage.setItem(SAVE_KEY.value, dataUrl)
}

const saveDraftThrottled = throttle(saveDraft, 800)

const restoreDraft = () => {
  const raw = localStorage.getItem(SAVE_KEY.value)
  if (!raw || !canvasRef.value || !ctx.value) return
  
  const img = new Image()
  img.onload = () => {
    // Need to temporarily reset scale to draw image correctly
    const dpr = window.devicePixelRatio || 1
    ctx.value.setTransform(1, 0, 0, 1, 0, 0)
    ctx.value.drawImage(img, 0, 0)
    // Restore scale
    ctx.value.scale(dpr, dpr)
  }
  img.src = raw
}

const startDrawing = (e) => {
  if (!ctx.value || !isDrawer.value) return
  if (e.type.startsWith('touch')) {
    e.preventDefault() // Prevent scroll/zoom on touch start
  }
  isDrawing.value = true
  const { offsetX, offsetY } = getCoordinates(e)
  
  // Start new path
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)
  // Draw a dot immediately for single clicks/taps
  ctx.value.lineTo(offsetX, offsetY)
  ctx.value.stroke()
  
  // Prepare for next move
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)
}

const draw = (e) => {
  if (!isDrawing.value || !ctx.value) return
  if (e.type.startsWith('touch')) {
    e.preventDefault() // Prevent scroll/zoom on touch move
  }
  
  // Use requestAnimationFrame or direct drawing
  const { offsetX, offsetY } = getCoordinates(e)
  ctx.value.lineTo(offsetX, offsetY)
  ctx.value.stroke()
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (ctx.value) {
    ctx.value.closePath()
  }
  saveDraftThrottled()
}

const getCoordinates = (e) => {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  let clientX, clientY

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  // Because ctx.scale(dpr, dpr) handles the retina display scaling,
  // we ONLY need to provide the coordinates in CSS pixels.
  // The distance from the top-left corner of the bounding rect is exactly that.
  return {
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top
  }
}

const setColor = (color) => {
  currentColor.value = color
  if (ctx.value) {
    ctx.value.strokeStyle = color
    // Ensure we start a new path with the new color
    ctx.value.beginPath() 
  }
}

const clearCanvas = () => {
  if (ctx.value && canvasRef.value) {
    const canvas = canvasRef.value
    // Clear using the actual internal dimensions
    // We divide by dpr because ctx is scaled
    const dpr = window.devicePixelRatio || 1
    ctx.value.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    // Refill with white background
    ctx.value.fillStyle = '#ffffff'
    ctx.value.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    localStorage.removeItem(SAVE_KEY.value) // Clear draft on manual clear
  }
}

// --- Constants & Utils ---
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000`

const withTimeout = (promise, ms = 5000) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('请求超时，请检查网络')), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('请求超时，请检查网络');
        }
        throw error;
    }
}

const submitDrawing = async () => {
  if (isSubmitting.value) return
  if (!canvasRef.value) return
  isSubmitting.value = true
  
  try {
    const blob = await new Promise(resolve => canvasRef.value.toBlob(resolve, 'image/png'))
    const formData = new FormData()
    formData.append('image', blob, 'drawing.png')
    formData.append('roomId', roomId)
    formData.append('roundId', currentRound.value.id)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error('未登录或登录已过期，请重新登录');
    }
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/game/submit-drawing`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData
    })

    if (!response.ok) {
        let errorMsg = '提交失败';
        try {
            const err = await response.json()
            errorMsg = err.error || errorMsg;
        } catch (e) {
            errorMsg = `Server Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMsg)
    }
    
    // Success - Backend updates round status to 'guessing', which triggers realtime update
    localStorage.removeItem(SAVE_KEY.value) // Clear draft on success
    alert('提交成功！') // Toast notification

  } catch (error) {
    console.error(error)
    alert(`提交失败: ${error.message}`)
  } finally {
    isSubmitting.value = false
  }
}

// --- Guessing Logic ---

const submitGuess = async () => {
    console.log('submitGuess clicked', guessInput.value)
    if (!guessInput.value.trim()) return
    if (isSubmitting.value) return
    isSubmitting.value = true

    try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/game/guess`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roundId: currentRound.value.id,
                guess: guessInput.value
            })
        })

        if (!response.ok) {
            let errorMsg = '猜词失败';
            try {
                const result = await response.json()
                errorMsg = result.error || errorMsg;
            } catch (e) {
                errorMsg = `Server Error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg)
        }

        const result = await response.json()

        // Whether correct or incorrect, we show the result and end the round locally
        myGuessResult.value = { isCorrect: result.isCorrect, points: result.points }
        
        // Optimistic update: End round locally
        if (currentRound.value) {
            currentRound.value.status = 'finished'
        }
        
        // Clear input
        guessInput.value = ''

        // Trigger fetch to be sure
        fetchActiveRound()

    } catch (error) {
        alert(error.message)
    } finally {
        isSubmitting.value = false
    }
}

const endRound = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetchWithTimeout(`${API_BASE_URL}/api/game/end-round`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ roundId: currentRound.value.id })
        })
    } catch (error) {
        console.error('End round error:', error)
        alert(`结束回合失败: ${error.message}`)
    } finally {
        isSubmitting.value = false
    }
}

const startNextRound = async () => {
    if (isSubmitting.value) return
    if (members.value.length < 2) {
        alert('玩家人数不足，无法继续下一回合！')
        return
    }
    isSubmitting.value = true
    try {
        // Pick random drawer (different from current if possible)
        let availableDrawers = members.value.filter(m => m.user_id !== currentRound.value.drawer_id)
        if (availableDrawers.length === 0) availableDrawers = members.value
        
        const drawer = availableDrawers[Math.floor(Math.random() * availableDrawers.length)]
        const words = ['猫咪', '火箭', '程序员', '外星人', '冰淇淋', '电脑', '自行车', '太阳']
        const targetWord = words[Math.floor(Math.random() * words.length)]

        const { error } = await withTimeout(supabase.from('game_rounds').insert({
            room_id: roomId,
            drawer_id: drawer.user_id,
            target_word: targetWord,
            round_number: currentRound.value.round_number + 1,
            status: 'drawing'
        }))
        if (error) throw error

    } catch (error) {
        console.error('Start next round error:', error)
        alert(`下一回合启动失败: ${error.message}`)
    } finally {
        isSubmitting.value = false
    }
}

// --- Lifecycle ---

onMounted(() => {
  fetchRoomData()
  setupRealtime()
  window.addEventListener('beforeunload', saveDraft)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', saveDraft)
  if (roomSub) supabase.removeChannel(roomSub)
  if (roundSub) supabase.removeChannel(roundSub)
  if (guessSub) supabase.removeChannel(guessSub)
  if (drawingSub) supabase.removeChannel(drawingSub)
})

// Watch phase to init canvas
watch(gamePhase, (newPhase) => {
    if (newPhase === 'drawing' && isDrawer.value) {
        nextTick(() => {
            // Give DOM a tiny bit of time to render the canvas before initializing
            setTimeout(initCanvas, 100)
        })
    }
})
</script>

<template>
  <div class="min-h-screen bg-green-300 flex flex-col font-mono" style="background-image: radial-gradient(#86efac 2px, transparent 2px); background-size: 30px 30px;">
    
    <!-- Loading -->
    <div v-if="loading" class="flex-grow flex items-center justify-center">
      <div class="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <p class="text-2xl font-black animate-bounce">加载中...</p>
      </div>
    </div>
    
    <!-- Main UI -->
    <div v-else-if="room" class="flex-grow flex flex-col p-4 md:p-8 h-screen overflow-hidden">
      <!-- Header -->
      <header class="flex-none bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl px-6 py-4 flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-black text-black flex items-center gap-2">
            ROOM: <span class="bg-yellow-300 px-2 border-2 border-black transform -rotate-2">{{ room.code }}</span>
          </h2>
          <p class="text-sm font-bold text-gray-600 mt-1">STATUS: {{ gamePhase.toUpperCase() }}</p>
        </div>
        
        <!-- Round Info -->
        <div v-if="currentRound" class="hidden md:block">
            <span class="text-xl font-black bg-blue-200 px-4 py-2 border-2 border-black rounded-lg">
                ROUND {{ currentRound.round_number }}
            </span>
        </div>

        <div class="flex items-center gap-4">
          <button @click="openInviteModal" class="px-4 py-2 bg-green-400 border-2 border-black rounded-lg text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] shadow-sm transition-all">
            邀请好友
          </button>
          <button @click="leaveRoom" class="px-4 py-2 bg-red-400 border-2 border-black rounded-lg text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] shadow-sm transition-all">
            离开
          </button>
        </div>
      </header>

      <main class="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
        
        <!-- Sidebar: Players -->
        <aside class="flex-none w-full md:w-64 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col overflow-hidden">
          <div class="p-4 border-b-4 border-black bg-blue-300">
            <h3 class="font-black text-xl text-black">PLAYERS</h3>
          </div>
          <div class="flex-grow overflow-y-auto p-3 space-y-2">
            <div v-for="member in members" :key="member.id" class="flex items-center p-2 border-2 border-black rounded-lg bg-white shadow-sm">
              <img :src="member.profiles.avatar_url" class="w-8 h-8 rounded-full border-2 border-black bg-gray-200">
              <div class="ml-2 flex-grow overflow-hidden">
                <p class="text-xs font-bold truncate">
                  {{ member.profiles.nickname }}
                  <span v-if="member.user_id === userStore.user.id" class="text-blue-600">(YOU)</span>
                </p>
                <p class="text-[10px] font-black">Score: {{ member.profiles.total_points }}</p>
              </div>
              <div class="w-3 h-3 rounded-full border-2 border-black" :class="member.is_online ? 'bg-green-500' : 'bg-gray-400'"></div>
            </div>
          </div>
          <div v-if="isOwner && gamePhase === 'waiting'" class="p-3 border-t-4 border-black bg-gray-50">
            <button @click="startGame" :disabled="isSubmitting || members.length < 2" class="w-full py-2 bg-yellow-400 border-4 border-black rounded-lg font-black text-black hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting ? 'STARTING...' : (members.length < 2 ? '等待更多玩家...' : 'START GAME') }}
            </button>
          </div>
        </aside>

        <!-- Center: Game Area -->
        <section class="flex-grow flex flex-col bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl relative overflow-hidden">
            
            <!-- Waiting Phase -->
            <div v-if="gamePhase === 'waiting'" class="flex-grow flex flex-col items-center justify-center p-10 bg-gray-50">
                <h3 class="text-4xl font-black mb-4">WAITING FOR PLAYERS...</h3>
                <p class="text-xl">Invite Code: <span class="font-mono bg-black text-white px-2">{{ room.code }}</span></p>
            </div>

            <!-- Drawing Phase -->
            <div v-else-if="gamePhase === 'drawing'" class="flex-grow flex flex-col h-full">
                <!-- Drawer View -->
                <div v-if="isDrawer" class="flex flex-col h-full">
                    <div class="flex-none p-2 bg-yellow-100 border-b-4 border-black flex justify-between items-center">
                        <span class="font-black text-lg">🎨 你的回合！请画: <span class="text-red-600 text-2xl">{{ currentRound.target_word }}</span></span>
                        <div class="flex gap-1">
                            <button @click="setColor('#000')" class="w-6 h-6 rounded-full bg-black border-2 border-white ring-2 ring-black"></button>
                            <button @click="setColor('#f00')" class="w-6 h-6 rounded-full bg-red-500 border-2 border-white ring-2 ring-black"></button>
                            <button @click="setColor('#00f')" class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white ring-2 ring-black"></button>
                            <button @click="clearCanvas" class="ml-2 px-2 py-0.5 text-xs font-bold border-2 border-black rounded bg-white">Clear</button>
                        </div>
                    </div>
                    <div class="flex-grow relative bg-white">
                        <canvas ref="canvasRef" 
                            @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing"
                            @touchstart.passive="false" @touchmove.passive="false"
                            @touchstart="startDrawing" @touchmove="draw" @touchend="stopDrawing" @touchcancel="stopDrawing"
                            class="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                        ></canvas>
                    </div>
                    <div class="flex-none p-4 border-t-4 border-black bg-gray-100 flex justify-center">
                        <button @click="submitDrawing" :disabled="isSubmitting" class="px-8 py-3 bg-blue-400 border-4 border-black rounded-xl text-xl font-black hover:translate-y-1 transition-transform">
                            {{ isSubmitting ? '提交中...' : '提交画作' }}
                        </button>
                    </div>
                </div>

                <!-- Guesser View (Waiting for drawing) -->
                <div v-else class="flex-grow flex items-center justify-center bg-gray-100">
                    <div class="text-center">
                        <p class="text-4xl animate-pulse">👨‍🎨</p>
                        <h3 class="text-2xl font-black mt-4">画师正在作画中...</h3>
                        <p class="text-gray-500 mt-2">准备好你的猜测！</p>
                    </div>
                </div>
            </div>

            <!-- Guessing Phase -->
            <div v-else-if="gamePhase === 'guessing'" class="flex-grow flex flex-col h-full">
                <div class="flex-none p-2 bg-yellow-100 border-b-4 border-black flex justify-between items-center">
                    <span class="font-black text-lg">
                        {{ isDrawer ? `你画的是: ${currentRound.target_word}` : '正在猜词中...' }}
                    </span>
                    <button v-if="isDrawer" @click="endRound" :disabled="isSubmitting" class="px-4 py-1 bg-red-400 border-2 border-black rounded font-black hover:bg-red-300">
                        {{ isSubmitting ? '...' : '结束回合' }}
                    </button>
                </div>
                <div class="flex-grow relative bg-gray-200 flex items-center justify-center p-4">
                    <img v-if="currentDrawing" :src="currentDrawing.image_url" class="max-w-full max-h-full border-4 border-black shadow-lg rounded-lg bg-white">
                    <div v-else class="text-xl font-bold">Loading Drawing...</div>
                    
                    <!-- AI Hint Overlay -->
                    <div v-if="currentDrawing?.ai_hint_text" class="absolute bottom-4 left-0 right-0 flex justify-center">
                        <div class="bg-yellow-200 border-4 border-black px-6 py-3 rounded-full shadow-lg transform -rotate-1">
                            <span class="font-black text-lg">🤖 AI 提示: {{ currentDrawing.ai_hint_text }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Finished Phase (Round Settlement) -->
            <div v-else-if="gamePhase === 'finished'" class="flex-grow flex flex-col h-full bg-blue-100 p-8 items-center justify-center">
                <h2 class="text-4xl font-black mb-6 animate-bounce">回合结束!</h2>
                
                <div class="bg-white border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-lg w-full">
                    <p class="text-xl font-bold mb-2">正确答案是</p>
                    <p class="text-5xl font-black text-red-500 mb-6">{{ currentRound.target_word }}</p>
                    
                    <img v-if="currentDrawing" :src="currentDrawing.image_url" class="w-48 h-48 object-contain mx-auto border-2 border-black mb-6 bg-gray-50 rounded">

                    <h4 class="font-black text-lg mb-3 bg-yellow-200 border-2 border-black rounded inline-block px-4 py-1">得分榜</h4>
                    <div class="space-y-2 max-h-40 overflow-y-auto mb-6">
                        <div v-for="log in guessLogs.filter(g => g.is_correct)" :key="log.id" class="flex justify-between items-center bg-gray-100 p-2 border-2 border-black rounded">
                            <span class="font-bold">{{ log.profiles.nickname }}</span>
                            <span class="text-green-600 font-black">+{{ log.points_earned }} 分</span>
                        </div>
                        <div v-if="guessLogs.filter(g => g.is_correct).length === 0" class="text-gray-500 font-bold">
                            没有人猜对 😢
                        </div>
                    </div>

                    <button v-if="isOwner" @click="startNextRound" :disabled="isSubmitting" class="w-full py-3 bg-yellow-400 border-4 border-black rounded-xl text-xl font-black hover:translate-y-1 transition-transform">
                        {{ isSubmitting ? '加载中...' : '下一回合' }}
                    </button>
                    <p v-else class="text-gray-500 font-bold animate-pulse">等待房主开始下一回合...</p>
                </div>
            </div>

        </section>

        <!-- Sidebar: Chat/Logs -->
        <aside class="flex-none w-full md:w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col overflow-hidden">
            <div class="p-4 border-b-4 border-black bg-purple-300">
                <h3 class="font-black text-xl text-black">GUESSES</h3>
            </div>
            
            <div class="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50">
                <div v-for="log in guessLogs" :key="log.id" class="text-sm">
                    <span class="font-bold">{{ log.profiles.nickname }}:</span>
                    <span :class="log.is_correct ? 'text-green-600 font-black' : 'text-gray-600'">
                        {{ log.is_correct ? '🎉 猜对了！' : log.guess_content }}
                    </span>
                </div>
                <div v-if="guessLogs.length === 0" class="text-center text-gray-400 italic mt-4">暂无猜测</div>
            </div>

            <!-- Guess Input Area -->
            <div v-if="gamePhase === 'guessing' && !isDrawer && !myGuessResult?.isCorrect" class="p-3 border-t-4 border-black bg-white">
                <form @submit.prevent="submitGuess" class="flex gap-2">
                    <input v-model="guessInput" type="text" placeholder="输入你的答案..." class="flex-grow border-2 border-black rounded-lg px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <button type="submit" :disabled="isSubmitting" class="bg-green-400 border-2 border-black rounded-lg px-4 font-black hover:bg-green-300">GO</button>
                </form>
            </div>
            <div v-else-if="myGuessResult?.isCorrect" class="p-4 border-t-4 border-black bg-green-100 text-center">
                <p class="font-black text-green-700 text-lg">✅ 你已猜对！</p>
                <p class="font-bold">+{{ myGuessResult.points }} 分</p>
            </div>
             <div v-else-if="isDrawer" class="p-4 border-t-4 border-black bg-gray-100 text-center">
                <p class="font-bold text-gray-500">你是画师，不能猜测哦</p>
            </div>
        </aside>

      </main>
    </div>

    <!-- Invite Friend Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm">
        <h3 class="text-xl font-black mb-4">邀请好友加入房间</h3>
        
        <div class="max-h-60 overflow-y-auto space-y-2 mb-6">
          <div v-if="friendsList.length === 0" class="text-center text-gray-500 font-bold">没有可邀请的好友</div>
          <div v-for="friend in friendsList" :key="friend.id" class="flex justify-between items-center p-2 border-2 border-black rounded-xl">
            <span class="font-bold truncate">{{ getFriendProfile(friend).nickname }}</span>
            <button @click="inviteFriend(getFriendProfile(friend).id)" :disabled="isInviting" class="px-3 py-1 bg-blue-400 border-2 border-black rounded-lg font-bold hover:bg-blue-300 disabled:opacity-50">
              邀请
            </button>
          </div>
        </div>

        <button @click="showInviteModal = false" class="w-full py-2 bg-gray-200 border-2 border-black rounded-xl font-bold hover:bg-gray-300">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>
