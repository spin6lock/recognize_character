<template>
  <canvas ref="canvasRef" class="fixed inset-0 pointer-events-none z-50" />
</template>

<script setup>
import { ref } from 'vue'
import confetti from 'canvas-confetti'

const canvasRef = ref(null)

function fire() {
  if (!canvasRef.value) return
  const myConfetti = confetti.create(canvasRef.value, { resize: true })
  myConfetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#FF8C00', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
    shapes: ['star', 'circle'],
    scalar: 1.2,
  })
}

defineExpose({ fire })
</script>
