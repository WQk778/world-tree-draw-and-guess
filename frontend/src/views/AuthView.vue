<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const nickname = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isLogin.value) {
      await userStore.signIn(email.value, password.value)
    } else {
      if (!nickname.value) throw new Error('请输入昵称')
      await userStore.signUp(email.value, password.value, nickname.value)
    }
    router.push('/lobby')
  } catch (error) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-hidden">
    <!-- World Tree Background -->
    <div class="absolute inset-0 z-0 bg-gray-900">
      <img src="https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?q=80&w=2000&auto=format&fit=crop" 
           alt="World Tree" 
           class="w-full h-full object-cover opacity-80 mix-blend-overlay" 
           @error="$event.target.style.display='none'" />
      <!-- Golden/Fire glow gradient overlay to match the reference image -->
      <div class="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-black/40 to-black/80"></div>
    </div>

    <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
      <h1 class="text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tight mb-4">
        🌳 世界树
      </h1>
      <h2 class="text-3xl font-black text-green-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
        你画我猜
      </h2>
    </div>

    <div class="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white/95 backdrop-blur py-8 px-4 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:px-10">
        <h2 class="mb-6 text-center text-3xl font-black text-black tracking-tight border-b-4 border-black pb-4">
          {{ isLogin ? '👋 欢迎回来' : '✨ 创建新账号' }}
        </h2>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div v-if="!isLogin">
            <label for="nickname" class="block text-lg font-bold text-gray-900">
              昵称
            </label>
            <div class="mt-1">
              <input v-model="nickname" id="nickname" type="text" required
                class="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] sm:text-lg transition-all" />
            </div>
          </div>

          <div>
            <label for="email" class="block text-lg font-bold text-gray-900">
              邮箱地址
            </label>
            <div class="mt-1">
              <input v-model="email" id="email" type="email" autocomplete="email" required
                class="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] sm:text-lg transition-all" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-lg font-bold text-gray-900">
              密码
            </label>
            <div class="mt-1">
              <input v-model="password" id="password" type="password" autocomplete="current-password" required
                class="appearance-none block w-full px-4 py-3 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:border-blue-500 focus:shadow-[4px_4px_0px_0px_rgba(59,130,246,1)] sm:text-lg transition-all" />
            </div>
          </div>

          <div v-if="errorMsg" class="text-red-600 font-bold text-center bg-red-100 border-2 border-red-600 rounded-lg py-2">
            {{ errorMsg }}
          </div>

          <div class="pt-2">
            <button type="submit" :disabled="loading"
              class="w-full flex justify-center py-4 px-4 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xl font-black text-black bg-blue-400 hover:bg-blue-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-50 transition-all">
              {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
            </button>
          </div>
        </form>

        <div class="mt-8 text-center">
          <button @click="isLogin = !isLogin" class="text-gray-600 hover:text-black font-bold text-md underline decoration-2 underline-offset-4">
            {{ isLogin ? '没有账号？点击注册' : '已有账号？点击登录' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
