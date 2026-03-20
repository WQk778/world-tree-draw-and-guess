import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/admin'
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // Make sure auth state is initialized
  if (!userStore.isInitialized) {
    await userStore.initialize()
  }

  if (to.meta.requiresAuth && !userStore.user) {
    next('/auth')
  } else if (to.path === '/auth' && userStore.user) {
    next('/admin')
  } else {
    next()
  }
})

export default router
