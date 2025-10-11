<template>
  <div class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

// Initialize auth on app load
onMounted(async () => {
  await authStore.initialize()
})
</script>
