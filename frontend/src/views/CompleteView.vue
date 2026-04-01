<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-amber-50 px-4 py-8">
    <ConfettiEffect ref="confettiRef" />

    <!-- 完成图标 -->
    <div class="text-7xl mb-4 animate-bounce">🎉</div>
    <h1 class="text-3xl font-bold text-orange-500 mb-2">太棒了！</h1>
    <p class="text-gray-400 mb-8">今天的识字挑战完成啦！</p>

    <!-- 成绩卡片 -->
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-md p-6 mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center bg-amber-50 rounded-2xl p-4">
          <div class="text-3xl font-bold text-orange-500">{{ sessionStore.challengeCount }}</div>
          <div class="text-gray-400 text-sm mt-1">挑战字数</div>
        </div>
        <div class="text-center bg-green-50 rounded-2xl p-4">
          <div class="text-3xl font-bold text-green-500">{{ firstRoundCorrect }}</div>
          <div class="text-gray-400 text-sm mt-1">一次通过</div>
        </div>
        <div class="text-center bg-yellow-50 rounded-2xl p-4">
          <div class="text-3xl font-bold text-yellow-500">{{ reviewCorrect }}</div>
          <div class="text-gray-400 text-sm mt-1">练习后通过</div>
        </div>
        <div class="text-center bg-blue-50 rounded-2xl p-4">
          <div class="text-3xl font-bold text-blue-400">{{ durationText }}</div>
          <div class="text-gray-400 text-sm mt-1">用时</div>
        </div>
      </div>

      <!-- 连续打卡 -->
      <div class="mt-4 text-center">
        <span class="text-2xl">🔥</span>
        <span class="text-xl font-bold text-orange-500 ml-1">连续打卡 {{ streak }} 天</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="w-full max-w-sm flex flex-col gap-3">
      <button
        @click="goHistory"
        class="w-full py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg btn-bounce"
      >
        📅 查看历史
      </button>
      <button
        @click="goHome"
        class="w-full py-4 rounded-full text-lg font-bold text-orange-400 bg-white border-2 border-orange-300 btn-bounce"
      >
        🏠 回到首页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session.js'
import { submitCheckin, fetchStreak, fetchRandomAudio } from '../api/index.js'
import ConfettiEffect from '../components/ConfettiEffect.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const confettiRef = ref(null)
const streak = ref(0)

const firstRoundCorrect = computed(() =>
  sessionStore.details.filter((d) => d.round_correct === 1).length
)

const reviewCorrect = computed(() =>
  sessionStore.details.filter((d) => d.round_correct > 1 && d.is_correct === 1).length
)

const durationText = computed(() => {
  const seconds = sessionStore.getDurationSeconds()
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) return `${minutes}分${remainingSeconds}秒`
  return `${seconds}秒`
})

const totalRounds = computed(() => {
  const maxRound = sessionStore.details.reduce(
    (max, detail) => Math.max(max, detail.round_correct),
    1
  )
  return maxRound
})

async function playCompleteAudio() {
  try {
    const response = await fetchRandomAudio('complete')
    if (response.data?.audio_url) {
      const audio = new Audio(response.data.audio_url)
      audio.play().catch(() => {})
    }
  } catch {
    // 静默忽略
  }
}

async function syncCheckin() {
  try {
    const payload = sessionStore.buildCheckinPayload(totalRounds.value)
    await submitCheckin(payload)
    localStorage.removeItem('quiz_session')
  } catch {
    // 离线时保留 localStorage，下次恢复网络后可重试
  }
}

async function loadStreak() {
  try {
    const response = await fetchStreak()
    streak.value = response.data.streak_days
  } catch {
    // 离线时忽略
  }
}

function goHistory() {
  sessionStore.clearSession()
  router.push('/history')
}

function goHome() {
  sessionStore.clearSession()
  router.push('/')
}

onMounted(async () => {
  confettiRef.value?.fire()
  await Promise.all([syncCheckin(), loadStreak(), playCompleteAudio()])
})
</script>
