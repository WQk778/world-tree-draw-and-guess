import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const isInitialized = ref(false)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }

  async function initialize() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      profile.value = await fetchProfile(session.user.id)
    }
    
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        user.value = session.user
        profile.value = await fetchProfile(session.user.id)
      } else {
        user.value = null
        profile.value = null
      }
    })
    
    isInitialized.value = true
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signUp(email, password, nickname) {
    // Call backend to create user (bypasses email confirmation)
    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }

      // Automatically sign in after successful creation
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Signup error:', err)
      throw err
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    isInitialized,
    initialize,
    signIn,
    signUp,
    signOut
  }
})
