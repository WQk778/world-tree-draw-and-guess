<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../lib/supabase'

const router = useRouter()
const userStore = useUserStore()

const joinCode = ref('')
const errorMsg = ref('')
const loading = ref(false)

const fetchWithTimeout = async (url, options = {}) => {
    const { timeout = 5000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') throw new Error('请求超时，请检查网络');
        throw error;
    }
}

const createRoom = async () => {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('未登录')

    const response = await fetchWithTimeout('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ maxPlayers: 8 })
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error?.message || result.error || '创建房间失败')
    }

    router.push(`/room/${result.room.id}`)
  } catch (error) {
    console.error(error)
    errorMsg.value = error.message || '创建房间失败，请重试'
  } finally {
    loading.value = false
  }
}

const joinRoom = async () => {
  if (loading.value) return
  if (!joinCode.value || joinCode.value.length !== 6) {
    errorMsg.value = '请输入6位有效房间码'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('未登录')

    const response = await fetchWithTimeout('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ code: joinCode.value.toUpperCase() })
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || '加入房间失败')
    }

    router.push(`/room/${result.room.id}`)
  } catch (error) {
    console.error(error)
    errorMsg.value = error.message || '加入房间失败，请重试'
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  await userStore.signOut()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen font-sans relative overflow-hidden flex flex-col">
    <!-- World Tree Background -->
    <div class="absolute inset-0 z-0 bg-gray-900">
      <img src="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?q=80&w=2000&auto=format&fit=crop" 
           alt="World Tree" 
           class="w-full h-full object-cover opacity-80 mix-blend-overlay" 
           @error="$event.target.style.display='none'" />
      <div class="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-black/40 to-black/80"></div>
    </div>

    <nav class="relative z-10 bg-white/90 backdrop-blur-sm border-b-4 border-black px-6 py-4 flex justify-between items-center shadow-[0_4px_0px_0px_rgba(0,0,0,1)] sticky top-0">
      <div class="flex items-center">
        <h1 class="text-3xl font-black text-green-800 tracking-tight drop-shadow-md">� 世界树你画我猜</h1>
      </div>
      <div class="flex items-center space-x-6">
        <button @click="router.push('/rankings')" class="px-4 py-2 bg-blue-300 border-2 border-black rounded-lg font-black hover:translate-y-1 transition-transform">
          🏆 排行榜
        </button>
        <button @click="router.push('/profile')" class="px-4 py-2 bg-pink-300 border-2 border-black rounded-lg font-black hover:translate-y-1 transition-transform flex items-center gap-2">
          <img :src="userStore.profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userStore.user?.id}`" class="w-6 h-6 rounded-full border border-black bg-white" alt="avatar">
          {{ userStore.profile?.nickname || 'Profile' }}
        </button>
        <button @click="logout" class="text-md font-bold text-black border-2 border-black rounded-xl px-4 py-2 hover:bg-red-400 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all bg-white">
          退出
        </button>
      </div>
    </nav>

    <main class="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-4 flex-grow flex flex-col items-center">
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-10">
        
        <!-- Create Room Card -->
        <div class="bg-purple-300/95 backdrop-blur border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-between text-center transform transition-transform hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex flex-col items-center">
            <div class="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="text-4xl">🏠</span>
            </div>
            <h3 class="text-3xl font-black text-black mb-3">创建新房间</h3>
            <p class="text-lg font-bold text-gray-800 mb-8">创建一个专属房间，邀请好友一起畅玩</p>
          </div>
          <button 
            @click="createRoom"
            :disabled="loading"
            class="w-full py-4 border-4 border-black text-xl font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black bg-yellow-400 hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-50 transition-all"
          >
            {{ loading ? '创建中...' : '立即创建' }}
          </button>
        </div>

        <!-- Join Room Card -->
        <div class="bg-green-300/95 backdrop-blur border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-between text-center transform transition-transform hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex flex-col items-center w-full">
            <div class="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="text-4xl">🔑</span>
            </div>
            <h3 class="text-3xl font-black text-black mb-3">加入房间</h3>
            <p class="text-lg font-bold text-gray-800 mb-6">输入好友分享的6位房间码加入游戏</p>
          </div>
          
          <div class="w-full space-y-4">
            <input 
              v-model="joinCode" 
              type="text" 
              maxlength="6"
              placeholder="输入 6 位房间码"
              class="text-center text-3xl font-black tracking-[0.5em] block w-full px-4 py-4 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-black focus:bg-white bg-gray-50 uppercase"
            />
            <button 
              @click="joinRoom"
              :disabled="loading || joinCode.length !== 6"
              class="w-full py-4 border-4 border-black text-xl font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black bg-blue-400 hover:bg-blue-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-50 transition-all"
            >
              {{ loading ? '加入中...' : '进入房间' }}
            </button>
          </div>
        </div>

        <!-- OneStroke Mode Card -->
        <div class="bg-orange-300/95 backdrop-blur border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center justify-between text-center transform transition-transform hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex flex-col items-center">
            <div class="w-20 h-20 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span class="text-4xl">🖌️</span>
            </div>
            <h3 class="text-3xl font-black text-black mb-3">一笔画大挑战</h3>
            <p class="text-lg font-bold text-gray-800 mb-8">单人模式，AI智能裁判，挑战你的空间想象力</p>
          </div>
          
          <button 
            @click="router.push('/onestroke')" 
            class="w-full py-4 bg-white text-black border-4 border-black rounded-xl text-xl font-black hover:bg-orange-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap"
          >
            立即挑战 🚀
          </button>
        </div>

      </div>

      <div v-if="errorMsg" class="mt-8 w-full max-w-2xl p-4 bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <p class="text-lg font-black text-black text-center">⚠️ {{ errorMsg }}</p>
      </div>
    </main>
  </div>
</template>
