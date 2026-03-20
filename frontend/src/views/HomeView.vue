<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleStart = () => {
  if (userStore.user) {
    router.push('/lobby')
  } else {
    router.push('/auth')
  }
}
</script>

<template>
  <div class="min-h-screen bg-yellow-300 flex flex-col items-center justify-center p-4" style="background-image: radial-gradient(#fbbf24 2px, transparent 2px); background-size: 30px 30px;">
    <div class="max-w-2xl text-center bg-white p-12 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform transition-transform hover:-translate-y-1">
      <h1 class="text-6xl font-black text-black mb-6 tracking-tight">
        <span class="text-blue-600">AI</span> 你画我猜 🎨
      </h1>
      <p class="text-xl text-gray-800 font-medium mb-10 leading-relaxed">
        体验由 AI 驱动的全新你画我猜！<br/>画出你的创意，让 AI 帮你生成有趣的提示词。
      </p>
      <button 
        @click="handleStart"
        class="px-10 py-5 bg-green-400 text-black text-2xl font-black rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-green-300 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
      >
        🚀 快速开始游戏
      </button>
    </div>
  </div>
</template>
