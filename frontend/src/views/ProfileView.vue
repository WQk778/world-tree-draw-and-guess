<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const profile = ref(null)
const guessHistory = ref([])
const loading = ref(true)

const isEditingName = ref(false)
const newNickname = ref('')
const updatingName = ref(false)

const fetchProfile = async () => {
  try {
    loading.value = true
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userStore.user.id)
      .single()

    if (profileError) throw profileError
    profile.value = profileData

    // Fetch recent guesses
    const { data: guesses, error: guessError } = await supabase
      .from('guess_records')
      .select(`
        *,
        drawings (
            image_url,
            game_rounds ( target_word )
        )
      `)
      .eq('user_id', userStore.user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (guessError) throw guessError
    guessHistory.value = guesses

  } catch (error) {
    console.error('Fetch profile error:', error)
  } finally {
    loading.value = false
  }
}

const startEditName = () => {
  newNickname.value = profile.value.nickname
  isEditingName.value = true
}

const cancelEditName = () => {
  isEditingName.value = false
  newNickname.value = ''
}

const saveNickname = async () => {
  if (!newNickname.value.trim() || newNickname.value === profile.value.nickname) {
    cancelEditName()
    return
  }

  updatingName.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ nickname: newNickname.value.trim() })
      .eq('id', userStore.user.id)

    if (error) throw error

    // Update local state
    profile.value.nickname = newNickname.value.trim()
    // Also update userStore profile if it exists there
    if (userStore.profile) {
      userStore.profile.nickname = newNickname.value.trim()
    }
    
    isEditingName.value = false
  } catch (error) {
    console.error('Error updating nickname:', error)
    alert('修改昵称失败，请稍后重试')
  } finally {
    updatingName.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="min-h-screen bg-blue-300 flex flex-col font-mono p-4 md:p-8" style="background-image: radial-gradient(#93c5fd 2px, transparent 2px); background-size: 30px 30px;">
    <header class="flex justify-between items-center bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <h1 class="text-3xl font-black text-black tracking-tighter">👤 个人中心</h1>
      <button @click="router.push('/lobby')" class="px-6 py-2 bg-yellow-400 border-4 border-black rounded-lg font-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
        返回大厅
      </button>
    </header>

    <main v-if="!loading && profile" class="flex-grow flex flex-col md:flex-row gap-8 max-w-6xl w-full mx-auto">
      
      <!-- Profile Info -->
      <aside class="w-full md:w-1/3 bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col items-center">
        <img :src="profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`" class="w-32 h-32 rounded-full border-4 border-black bg-gray-100 mb-4">
        
        <!-- Editable Nickname -->
        <div class="mb-2 w-full flex flex-col items-center min-h-[3rem]">
          <div v-if="!isEditingName" class="flex items-center gap-2 group cursor-pointer" @click="startEditName" title="点击修改昵称">
            <h2 class="text-2xl font-black">{{ profile.nickname }}</h2>
            <span class="text-gray-400 group-hover:text-black transition-colors">✏️</span>
          </div>
          <div v-else class="flex items-center gap-2 w-full max-w-[200px]">
            <input 
              v-model="newNickname" 
              type="text" 
              class="w-full px-2 py-1 border-2 border-black rounded font-black focus:outline-none focus:bg-yellow-100"
              @keyup.enter="saveNickname"
              @keyup.esc="cancelEditName"
              :disabled="updatingName"
              autofocus
            >
            <div class="flex flex-col gap-1">
              <button @click="saveNickname" :disabled="updatingName" class="p-1 bg-green-400 border-2 border-black rounded hover:bg-green-500 text-xs font-black">
                {{ updatingName ? '...' : '✓' }}
              </button>
              <button @click="cancelEditName" :disabled="updatingName" class="p-1 bg-red-400 border-2 border-black rounded hover:bg-red-500 text-xs font-black">
                ✗
              </button>
            </div>
          </div>
        </div>

        <div class="bg-black text-white px-6 py-2 rounded-full font-black text-xl transform -rotate-2 mb-6">
          总积分: {{ profile.total_points }}
        </div>
        
        <div class="w-full space-y-3">
          <div class="bg-gray-50 border-2 border-black p-3 rounded flex justify-between">
            <span class="font-bold">邮箱</span>
            <span class="text-sm">{{ userStore.user.email }}</span>
          </div>
          <div class="bg-gray-50 border-2 border-black p-3 rounded flex justify-between">
            <span class="font-bold">注册时间</span>
            <span class="text-sm">{{ new Date(profile.created_at).toLocaleDateString() }}</span>
          </div>
        </div>

        <button @click="userStore.signOut(); router.push('/auth')" class="mt-auto w-full py-3 bg-red-400 border-4 border-black rounded-xl text-xl font-black hover:translate-y-1 transition-transform">
            退出登录
        </button>
      </aside>

      <!-- History -->
      <section class="flex-grow bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 overflow-hidden flex flex-col">
        <h3 class="text-2xl font-black mb-6 border-b-4 border-black pb-2">最近猜词记录</h3>
        
        <div class="flex-grow overflow-y-auto space-y-4 pr-2">
            <div v-for="record in guessHistory" :key="record.id" class="flex gap-4 p-4 border-2 border-black rounded-xl bg-gray-50">
                <img v-if="record.drawings?.image_url" :src="record.drawings.image_url" class="w-24 h-24 object-contain border-2 border-black bg-white rounded">
                <div class="flex-grow flex flex-col justify-center">
                    <p class="font-bold mb-1">猜测: <span class="text-lg bg-yellow-200 px-2">{{ record.guess_content }}</span></p>
                    <p class="text-sm text-gray-600 mb-2">正确答案: {{ record.drawings?.game_rounds?.target_word || '?' }}</p>
                    <div class="flex items-center gap-2">
                        <span v-if="record.is_correct" class="px-2 py-1 bg-green-400 border-2 border-black rounded text-xs font-black">正确 +{{ record.points_earned }}</span>
                        <span v-else class="px-2 py-1 bg-red-400 border-2 border-black rounded text-xs font-black text-white">错误</span>
                        <span class="text-xs text-gray-500">{{ new Date(record.created_at).toLocaleString() }}</span>
                    </div>
                </div>
            </div>
            <div v-if="guessHistory.length === 0" class="text-center text-gray-500 font-bold py-10">
                还没有猜词记录哦，快去玩一局吧！
            </div>
        </div>
      </section>

    </main>
  </div>
</template>
