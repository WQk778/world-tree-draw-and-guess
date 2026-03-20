<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const users = ref([])
const loading = ref(true)

const fetchRankings = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, total_points')
      .order('total_points', { ascending: false })
      .limit(100)

    if (error) throw error
    users.value = data || []
  } catch (error) {
    console.error('Fetch rankings error:', error)
    alert('获取排行榜失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRankings()
})
</script>

<template>
  <div class="min-h-screen bg-purple-300 flex flex-col font-mono p-4 md:p-8" style="background-image: radial-gradient(#d8b4fe 2px, transparent 2px); background-size: 30px 30px;">
    <header class="flex justify-between items-center bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <h1 class="text-3xl font-black text-black tracking-tighter">🏆 积分排行榜</h1>
      <button @click="router.push('/lobby')" class="px-6 py-2 bg-yellow-400 border-4 border-black rounded-lg font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
        返回大厅
      </button>
    </header>

    <main class="flex-grow bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
      <div v-if="loading" class="text-center py-10 font-black text-xl animate-pulse">
        加载中...
      </div>
      <div v-else class="flex-grow overflow-y-auto pr-2 space-y-4">
        <div v-for="(user, index) in users" :key="user.id" 
             class="flex items-center p-4 border-4 border-black rounded-xl bg-gray-50 hover:bg-yellow-50 transition-colors"
             :class="{'bg-yellow-200': index === 0, 'bg-gray-200': index === 1, 'bg-orange-200': index === 2}">
          
          <div class="w-12 h-12 flex-none flex items-center justify-center font-black text-2xl border-r-4 border-black mr-4 pr-4">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>#{{ index + 1 }}</span>
          </div>
          
          <img :src="user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`" class="w-12 h-12 rounded-full border-4 border-black bg-white">
          
          <div class="ml-4 flex-grow">
            <p class="font-black text-xl">{{ user.nickname || 'Unknown' }}</p>
          </div>
          
          <div class="flex-none bg-black text-white px-4 py-2 rounded-lg font-black text-xl transform rotate-2">
            {{ user.total_points }} PTS
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
