<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const rankings = ref([])
const loading = ref(true)

onMounted(async () => {
    try {
        const response = await fetch('http://localhost:3000/api/onestroke/rankings')
        const data = await response.json()
        rankings.value = data.rankings || []
    } catch (error) {
        console.error('Fetch rankings error:', error)
    } finally {
        loading.value = false
    }
})

// Helper to determine rank tier
const getTier = (score) => {
    if (score >= 1000) return { name: '大师', color: 'text-red-600', bg: 'bg-red-100', icon: '👑' }
    if (score >= 600) return { name: '钻石', color: 'text-blue-600', bg: 'bg-blue-100', icon: '💎' }
    if (score >= 300) return { name: '黄金', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '🥇' }
    if (score >= 100) return { name: '白银', color: 'text-gray-500', bg: 'bg-gray-100', icon: '🥈' }
    return { name: '青铜', color: 'text-orange-700', bg: 'bg-orange-100', icon: '🥉' }
}
</script>

<template>
  <div class="min-h-screen bg-purple-100 flex flex-col font-mono p-4 md:p-8" style="background-image: radial-gradient(#d8b4fe 2px, transparent 2px); background-size: 30px 30px;">
    
    <header class="max-w-4xl mx-auto w-full flex justify-between items-center bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <div class="flex items-center gap-4">
        <button @click="router.push('/onestroke')" class="px-4 py-2 bg-gray-200 border-4 border-black rounded-lg font-black hover:bg-gray-300 transition-colors">
            ← 回到挑战
        </button>
        <h1 class="text-3xl font-black text-black tracking-tighter">🏆 一笔画段位榜</h1>
      </div>
    </header>

    <main class="flex-grow max-w-4xl mx-auto w-full">
      <div class="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2 md:p-8">
        
        <div v-if="loading" class="text-center py-20 text-xl font-bold animate-pulse">
            加载排行榜数据中...
        </div>

        <div v-else-if="rankings.length === 0" class="text-center py-20 text-gray-500 font-bold">
            还没有人参与过挑战，快去拿下首胜！
        </div>

        <div v-else class="space-y-4">
            <div v-for="(player, index) in rankings" :key="player.user_id" 
                class="flex items-center p-4 border-4 border-black rounded-xl transition-transform hover:-translate-y-1"
                :class="index < 3 ? 'bg-yellow-50' : 'bg-white'"
            >
                <div class="w-12 text-3xl font-black text-center mr-4" :class="{'text-yellow-500': index===0, 'text-gray-400': index===1, 'text-yellow-700': index===2}">
                    {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}` }}
                </div>
                
                <img :src="player.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.user_id}`" 
                     class="w-16 h-16 rounded-full border-4 border-black bg-gray-200 mr-4">
                
                <div class="flex-grow">
                    <h3 class="text-xl font-black">{{ player.profiles?.nickname || '神秘画手' }}</h3>
                    <p class="text-sm text-gray-600 font-bold">成功挑战: {{ player.correct_count }} 次</p>
                </div>

                <div class="text-right flex flex-col items-end">
                    <span class="text-3xl font-black mb-1">{{ player.total_score }}<span class="text-sm ml-1">分</span></span>
                    <span :class="['px-3 py-1 border-2 border-black rounded-full text-xs font-black flex items-center gap-1', getTier(player.total_score).bg, getTier(player.total_score).color]">
                        <span>{{ getTier(player.total_score).icon }}</span>
                        {{ getTier(player.total_score).name }}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>