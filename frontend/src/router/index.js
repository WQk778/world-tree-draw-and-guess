import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../lib/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/lobby'
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/lobby',
      name: 'lobby',
      component: () => import('../views/LobbyView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rankings',
      name: 'rankings',
      component: () => import('../views/RankingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/room/:id',
      name: 'room',
      component: () => import('../views/RoomView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/onestroke',
      name: 'onestroke',
      component: () => import('../views/OneStrokeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/onestroke/rankings',
      name: 'onestroke-rankings',
      component: () => import('../views/OneStrokeRankingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // Make sure auth state is initialized
  if (!userStore.isInitialized) {
    await userStore.initialize()
  }

  const isAuthenticated = !!userStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/auth')
  } else if (to.meta.guestOnly && isAuthenticated) {
    next('/lobby')
  } else {
    next()
  }
})

export default router
