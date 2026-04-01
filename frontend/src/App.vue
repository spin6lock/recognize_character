<template>
  <div class="min-h-screen bg-amber-50 font-round">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" :app-title="appTitle" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import { fetchConfig } from './api'

const appTitle = ref('识字打卡')

onMounted(async () => {
  try {
    const { data } = await fetchConfig()
    if (data.title) {
      appTitle.value = data.title
      document.title = data.title
    }
  } catch {}
})

provide('appTitle', appTitle)
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
