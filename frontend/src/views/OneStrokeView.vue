<script setup>
import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../lib/supabase'

const router = useRouter()
const userStore = useUserStore()

const currentQuestion = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const aiResult = ref(null) // { isCorrect: boolean, message: string, points: number }

// Canvas states
const canvasRef = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const hasDrawn = ref(false)
const drawingStopped = ref(false)

// Init game
onMounted(async () => {
  await fetchQuestion()
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  window.removeEventListener('resize', initCanvas)
})

const fetchQuestion = async () => {
    isLoading.value = true
    aiResult.value = null
    hasDrawn.value = false
    drawingStopped.value = false

    try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('http://localhost:3000/api/onestroke/question', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        
        currentQuestion.value = data.question

    } catch (error) {
        console.error('Fetch question error:', error)
        alert('获取题目失败')
    } finally {
        isLoading.value = false
        
        // Wait for the DOM to render the canvas after isLoading becomes false
        await nextTick()
        if (currentQuestion.value) {
            initCanvas()
        }
    }
}

// Canvas Logic
const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  
  if (rect.width === 0 || rect.height === 0) {
      setTimeout(initCanvas, 50)
      return
  }

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  ctx.value = canvas.getContext('2d')
  ctx.value.scale(dpr, dpr)
  
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.strokeStyle = '#000000'
  ctx.value.lineWidth = 4
  
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, rect.width, rect.height)
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

  return {
    offsetX: clientX - rect.left,
    offsetY: clientY - rect.top
  }
}

const startDrawing = (e) => {
  if (drawingStopped.value || aiResult.value) return
  if (e.type.startsWith('touch')) e.preventDefault()
  
  isDrawing.value = true
  hasDrawn.value = true
  const { offsetX, offsetY } = getCoordinates(e)
  
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)
  ctx.value.lineTo(offsetX, offsetY)
  ctx.value.stroke()
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)
}

const draw = (e) => {
  if (!isDrawing.value || drawingStopped.value) return
  if (e.type.startsWith('touch')) e.preventDefault()
  
  const { offsetX, offsetY } = getCoordinates(e)
  ctx.value.lineTo(offsetX, offsetY)
  ctx.value.stroke()
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  ctx.value.closePath()
  
  // Rule: Only one stroke allowed
  drawingStopped.value = true
}

const clearCanvas = () => {
  if (ctx.value && canvasRef.value) {
    const canvas = canvasRef.value
    const dpr = window.devicePixelRatio || 1
    ctx.value.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    ctx.value.fillStyle = '#ffffff'
    ctx.value.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    
    hasDrawn.value = false
    drawingStopped.value = false
    aiResult.value = null
  }
}

const submitDrawing = async () => {
  if (!hasDrawn.value || isSubmitting.value) return
  isSubmitting.value = true
  
  try {
    const blob = await new Promise(resolve => canvasRef.value.toBlob(resolve, 'image/png'))
    const formData = new FormData()
    formData.append('image', blob, 'onestroke.png')
    formData.append('questionId', currentQuestion.value.id)
    formData.append('answerName', currentQuestion.value.answer_name)

    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch('http://localhost:3000/api/onestroke/submit', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
      body: formData
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '提交失败')
    
    aiResult.value = {
        isCorrect: result.isCorrect,
        message: result.aiMessage,
        points: result.points,
        raw: result.aiRaw
    }

  } catch (error) {
    console.error(error)
    alert(error.message)
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <div class="min-h-screen bg-orange-100 flex flex-col font-mono p-4 md:p-8" style="background-image: radial-gradient(#fbbf24 2px, transparent 2px); background-size: 30px 30px;">
    
    <header class="flex justify-between items-center bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
      <div class="flex items-center gap-4">
        <button @click="router.push('/lobby')" class="px-4 py-2 bg-gray-200 border-4 border-black rounded-lg font-black hover:bg-gray-300 transition-colors">
            ← 返回
        </button>
        <h1 class="text-3xl font-black text-black tracking-tighter">🖌️ 一笔画大挑战</h1>
      </div>
      <button @click="router.push('/onestroke/rankings')" class="px-4 py-2 bg-purple-400 text-white border-4 border-black rounded-lg font-black hover:bg-purple-500 transition-colors">
        🏆 段位榜
      </button>
    </header>

    <main v-if="isLoading" class="flex-grow flex items-center justify-center">
        <div class="text-2xl font-black animate-pulse">加载题目中...</div>
    </main>

    <main v-else-if="currentQuestion" class="flex-grow flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
        
        <!-- Left: Question -->
        <section class="flex-1 bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            <div class="p-4 border-b-4 border-black bg-yellow-200">
                <h2 class="text-xl font-black">目标图形: <span class="text-red-600">{{ currentQuestion.answer_name }}</span></h2>
                <p class="text-sm font-bold text-gray-700 mt-1">规则：只能用一笔画出，中途不能停顿断笔！</p>
            </div>
            <div class="flex-grow flex items-center justify-center p-8 bg-gray-50">
                <img :src="currentQuestion.image_url" class="max-w-full max-h-64 object-contain border-4 border-black shadow-lg rounded bg-white p-4">
            </div>
        </section>

        <!-- Right: Drawing Area -->
        <section class="flex-[2] bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
            <div class="p-2 border-b-4 border-black bg-blue-200 flex justify-between items-center">
                <span class="font-black">你的画布</span>
                <button @click="clearCanvas" :disabled="isSubmitting || aiResult" class="px-4 py-1 bg-red-400 text-white border-2 border-black rounded font-black hover:bg-red-500 disabled:opacity-50">
                    清空重画
                </button>
            </div>
            
            <div class="flex-grow relative bg-gray-100">
                <canvas 
                    ref="canvasRef"
                    class="w-full h-full cursor-crosshair touch-none"
                    @mousedown="startDrawing"
                    @mousemove="draw"
                    @mouseup="stopDrawing"
                    @mouseleave="stopDrawing"
                    @touchstart="startDrawing"
                    @touchmove="draw"
                    @touchend="stopDrawing"
                ></canvas>

                <!-- Warning overlay if pen lifted -->
                <div v-if="drawingStopped && !aiResult" class="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center pointer-events-none">
                    <span class="bg-yellow-300 border-4 border-black px-4 py-2 font-black rounded-xl shadow-lg transform rotate-2">
                        笔已离开画布！请提交或清空重画
                    </span>
                </div>

                <!-- AI Result Overlay -->
                <div v-if="aiResult" class="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6 z-10">
                    <div :class="[
                        'border-4 border-black p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center transform transition-transform hover:scale-105',
                        aiResult.isCorrect ? 'bg-green-300' : 'bg-red-300'
                    ]">
                        <div class="text-6xl mb-4">{{ aiResult.isCorrect ? '🎉' : '💥' }}</div>
                        <h3 class="text-3xl font-black mb-2">
                            {{ aiResult.message }}
                        </h3>
                        <p v-if="aiResult.isCorrect" class="text-xl font-bold mb-4 text-green-900">+{{ aiResult.points }} 积分</p>
                        
                        <!-- Show AI Reason -->
                        <div class="bg-white bg-opacity-60 border-2 border-black rounded-lg p-3 mb-6 text-sm text-left">
                            <span class="font-black block mb-1">🤖 裁判点评:</span>
                            <span class="font-bold text-gray-800">{{ aiResult.raw }}</span>
                        </div>

                        <button @click="fetchQuestion" class="w-full py-3 bg-black text-white border-4 border-black rounded-xl text-xl font-black hover:bg-gray-800 hover:text-yellow-300 transition-colors">
                            下一题
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t-4 border-black bg-gray-50 flex justify-center">
                <button 
                    @click="submitDrawing" 
                    :disabled="!hasDrawn || isSubmitting || !!aiResult" 
                    class="px-12 py-4 bg-blue-500 text-white border-4 border-black rounded-xl text-2xl font-black hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none"
                >
                    {{ isSubmitting ? 'AI 裁判打分中...' : '提交给裁判' }}
                </button>
            </div>
        </section>

    </main>
  </div>
</template>