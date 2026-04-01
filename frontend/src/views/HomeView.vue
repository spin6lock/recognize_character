<template>
  <div class="min-h-screen flex flex-col items-center px-4 py-8 bg-amber-50">
    <!-- 顶部标题 -->
    <div class="text-center mb-8">
      <div class="text-6xl mb-2">📖</div>
      <h1 class="text-3xl font-bold text-orange-500">{{ appTitle }}</h1>
      <p class="text-gray-400 mt-1 text-sm">每天学一点，进步看得见！</p>
    </div>

    <!-- 打卡状态卡片 -->
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-md p-5 mb-6">
      <div class="flex justify-between items-center">
        <div class="text-center flex-1">
          <div class="text-3xl font-bold text-orange-500">{{ wordStore.totalCount }}</div>
          <div class="text-gray-400 text-sm mt-1">字库总数</div>
        </div>
        <div class="w-px h-12 bg-amber-100" />
        <div class="text-center flex-1">
          <div class="text-3xl font-bold text-yellow-500">
            🔥 {{ streak.streak_days }}
          </div>
          <div class="text-gray-400 text-sm mt-1">连续打卡天</div>
        </div>
        <div class="w-px h-12 bg-amber-100" />
        <div class="text-center flex-1">
          <div class="text-3xl">{{ streak.checked_in_today ? '✅' : '⭕' }}</div>
          <div class="text-gray-400 text-sm mt-1">今日打卡</div>
        </div>
      </div>
    </div>

    <!-- 字数选择 -->
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-md p-5 mb-6">
      <h2 class="text-lg font-bold text-gray-700 mb-4">挑战字数</h2>
      <div class="grid grid-cols-4 gap-2 mb-4">
        <button
          v-for="option in countOptions"
          :key="option"
          @click="selectCount(option)"
          class="py-3 rounded-2xl font-bold text-lg btn-bounce transition-colors"
          :class="
            selectedCount === option && !isCustom
              ? 'bg-orange-400 text-white shadow-md'
              : 'bg-amber-100 text-orange-500'
          "
        >
          {{ option }}
        </button>
      </div>

      <!-- 自定义输入 -->
      <div class="flex items-center gap-3">
        <button
          @click="toggleCustom"
          class="py-3 px-4 rounded-2xl font-bold btn-bounce transition-colors"
          :class="isCustom ? 'bg-orange-400 text-white' : 'bg-amber-100 text-orange-500'"
        >
          自定义
        </button>
        <input
          v-if="isCustom"
          v-model.number="customCount"
          type="number"
          :min="1"
          :max="wordStore.totalCount"
          class="flex-1 border-2 border-amber-200 rounded-2xl px-4 py-3 text-center text-lg font-bold text-orange-500 focus:outline-none focus:border-orange-400"
          placeholder="输入字数"
        />
        <span v-if="isCustom" class="text-gray-400 text-sm">上限 {{ wordStore.totalCount }}</span>
      </div>
    </div>

    <!-- 开始按钮 -->
    <button
      @click="startChallenge"
      :disabled="!canStart"
      class="w-full max-w-sm py-5 rounded-full text-2xl font-bold text-white shadow-lg btn-bounce transition-all"
      :class="canStart ? 'bg-gradient-to-r from-orange-400 to-yellow-400' : 'bg-gray-200 text-gray-400'"
    >
      🚀 开始挑战！
    </button>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex justify-around py-3 px-4">
      <router-link to="/" class="flex flex-col items-center text-orange-400">
        <span class="text-2xl">🏠</span>
        <span class="text-xs mt-1">首页</span>
      </router-link>
      <router-link to="/history" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">📅</span>
        <span class="text-xs mt-1">历史</span>
      </router-link>
      <router-link to="/admin" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">⚙️</span>
        <span class="text-xs mt-1">管理</span>
      </router-link>
    </nav>

    <div class="h-20" />
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordStore } from '../stores/word.js'
import { useSessionStore } from '../stores/session.js'

const appTitle = inject('appTitle')
import { fetchStreak, fetchRandomWords } from '../api/index.js'

const router = useRouter()
const wordStore = useWordStore()
const sessionStore = useSessionStore()

const countOptions = [10, 15, 20]
const selectedCount = ref(10)
const isCustom = ref(false)
const customCount = ref(10)
const streak = ref({ streak_days: 0, checked_in_today: false })

const finalCount = computed(() => {
  if (isCustom.value) return Math.min(customCount.value, wordStore.totalCount)
  return selectedCount.value
})

const canStart = computed(() =>
  wordStore.totalCount > 0 && finalCount.value >= 1
)

function selectCount(count) {
  isCustom.value = false
  selectedCount.value = count
}

function toggleCustom() {
  isCustom.value = !isCustom.value
  if (isCustom.value) customCount.value = selectedCount.value
}

async function startChallenge() {
  if (!canStart.value) return
  const response = await fetchRandomWords(finalCount.value)
  sessionStore.startSession(response.data)
  router.push('/quiz')
}

onMounted(async () => {
  await wordStore.loadWords()
  try {
    const response = await fetchStreak()
    streak.value = response.data
  } catch {
    // 离线时忽略
  }
})
</script>
