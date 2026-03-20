<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const stats = ref({ totalUsers: 0, totalRooms: 0, totalDrawings: 0 })
const aiConfig = ref({ model: 'qwen-vl-max', threshold: 0.8 })
const pointRules = ref({ correctGuess: 10, quickGuessBonus: 5 })
const loading = ref(true)
const isSubmitting = ref(false)

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

const fetchStats = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetchWithTimeout('http://localhost:3000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    
    if (response.status === 403) {
      alert('无权限访问管理后台！')
      userStore.signOut()
      router.push('/auth')
      return
    }

    const data = await response.json()
    if (data.stats) stats.value = data.stats
    if (data.config) {
        aiConfig.value = data.config.ai
        pointRules.value = data.config.rules
    }
  } catch (error) {
    console.error('Fetch stats error:', error)
  } finally {
    loading.value = false
  }
}

const saveAiConfig = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetchWithTimeout('http://localhost:3000/api/admin/config/ai', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aiConfig.value)
        })
        if (!response.ok) throw new Error('保存失败')
        alert('AI 配置保存成功！')
    } catch (error) {
        alert(error.message)
    } finally {
        isSubmitting.value = false
    }
}

const saveRules = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetchWithTimeout('http://localhost:3000/api/admin/rules', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pointRules.value)
        })
        if (!response.ok) throw new Error('保存失败')
        alert('积分规则保存成功！')
    } catch (error) {
        alert(error.message)
    } finally {
        isSubmitting.value = false
    }
}

const logout = async () => {
  await userStore.signOut()
  router.push('/auth')
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-200 flex flex-col font-mono p-4 md:p-8" style="background-image: radial-gradient(#d1d5db 2px, transparent 2px); background-size: 30px 30px;">
    <header class="flex justify-between items-center bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <h1 class="text-3xl font-black text-black tracking-tighter">⚙️ 系统管理后台</h1>
      <button @click="logout" class="px-6 py-2 bg-red-400 border-4 border-black rounded-lg font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
        退出登录
      </button>
    </header>

    <main v-if="!loading" class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full mx-auto">
      
      <!-- Stats Dashboard -->
      <section class="col-span-1 md:col-span-2 grid grid-cols-3 gap-6">
        <div class="bg-blue-300 border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <h3 class="font-black text-xl mb-2">总用户数</h3>
            <p class="text-5xl font-black">{{ stats.totalUsers }}</p>
        </div>
        <div class="bg-green-300 border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <h3 class="font-black text-xl mb-2">房间总数</h3>
            <p class="text-5xl font-black">{{ stats.totalRooms }}</p>
        </div>
        <div class="bg-pink-300 border-4 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <h3 class="font-black text-xl mb-2">画作总数</h3>
            <p class="text-5xl font-black">{{ stats.totalDrawings }}</p>
        </div>
      </section>

      <!-- AI Config -->
      <section class="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 class="text-2xl font-black mb-6 border-b-4 border-black pb-2">🤖 AI 识别配置</h3>
        <div class="space-y-4">
            <div>
                <label class="block font-bold mb-2">AI 模型 (Model)</label>
                <select v-model="aiConfig.model" class="w-full p-2 border-2 border-black rounded bg-gray-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="qwen-vl-max">Qwen-VL-Max (千问多模态最大模型)</option>
                    <option value="qwen-vl-plus">Qwen-VL-Plus (千问多模态增强版)</option>
                </select>
            </div>
            <div>
                <label class="block font-bold mb-2">识别阈值 (Confidence Threshold)</label>
                <input type="number" step="0.1" v-model="aiConfig.threshold" class="w-full p-2 border-2 border-black rounded bg-gray-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <button @click="saveAiConfig" :disabled="isSubmitting" class="w-full py-2 mt-4 bg-black text-white font-black border-2 border-black rounded hover:bg-gray-800 transition-colors">
                {{ isSubmitting ? '保存中...' : '保存 AI 配置' }}
            </button>
        </div>
      </section>

      <!-- Game Rules -->
      <section class="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 class="text-2xl font-black mb-6 border-b-4 border-black pb-2">🎯 积分规则配置</h3>
        <div class="space-y-4">
            <div>
                <label class="block font-bold mb-2">基础猜对得分 (Correct Guess)</label>
                <input type="number" v-model="pointRules.correctGuess" class="w-full p-2 border-2 border-black rounded bg-gray-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <div>
                <label class="block font-bold mb-2">快速抢答奖励 (Quick Guess Bonus)</label>
                <input type="number" v-model="pointRules.quickGuessBonus" class="w-full p-2 border-2 border-black rounded bg-gray-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <button @click="saveRules" :disabled="isSubmitting" class="w-full py-2 mt-4 bg-black text-white font-black border-2 border-black rounded hover:bg-gray-800 transition-colors">
                {{ isSubmitting ? '保存中...' : '保存积分规则' }}
            </button>
        </div>
      </section>

    </main>
  </div>
</template>
