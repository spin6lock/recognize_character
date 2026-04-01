<template>
  <div class="w-full bg-amber-100 rounded-full h-3 overflow-hidden">
    <div
      class="h-3 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-500"
      :style="{ width: `${percentage}%` }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
})

const percentage = computed(() =>
  props.total > 0 ? Math.round((props.current / props.total) * 100) : 0
)
</script>
