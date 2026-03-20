<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initialize()
})
</script>

<template>
  <RouterView />
</template>

<style>
@import "tailwindcss";
</style>
