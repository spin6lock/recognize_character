<template>
  <div class="min-h-screen bg-amber-50 pb-24">
    <!-- 顶部 -->
    <div class="bg-white px-4 pt-8 pb-4 shadow-sm">
      <h1 class="text-2xl font-bold text-orange-500 text-center">📅 打卡历史</h1>
    </div>

    <!-- 日历视图 -->
    <div class="px-4 mt-4">
      <div class="bg-white rounded-3xl shadow-md p-4 mb-4">
        <!-- 月份导航 -->
        <div class="flex items-center justify-between mb-4">
          <button @click="prevMonth" class="text-2xl text-orange-400 btn-bounce px-2">‹</button>
          <span class="font-bold text-gray-700 text-lg">{{ currentYearMonth }}</span>
          <button @click="nextMonth" class="text-2xl text-orange-400 btn-bounce px-2">›</button>
        </div>

        <!-- 星期标题 -->
        <div class="grid grid-cols-7 mb-2">
          <div
            v-for="day in weekDays"
            :key="day"
            class="text-center text-xs text-gray-400 font-bold py-1"
          >
            {{ day }}
          </div>
        </div>

        <!-- 日期格子 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="(cell, index) in calendarCells"
            :key="index"
            class="aspect-square flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-colors"
            :class="getCellClass(cell)"
            @click="cell.date && selectDate(cell.date)"
          >
            <span v-if="cell.day">{{ cell.day }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 打卡记录列表 -->
    <div class="px-4">
      <h2 class="font-bold text-gray-600 mb-3">打卡记录</h2>
      <div v-if="isLoading" class="text-center text-gray-400 py-8">加载中…</div>
      <div v-else-if="records.length === 0" class="text-center text-gray-400 py-8">
        还没有打卡记录，快去挑战吧！
      </div>
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="record in records"
          :key="record.id"
          class="bg-white rounded-2xl shadow-sm p-4 cursor-pointer"
          @click="toggleDetail(record.id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-gray-700">{{ record.checkin_date }}</div>
              <div class="text-sm text-gray-400 mt-1">
                挑战 {{ record.challenge_count }} 字 ·
                正确率 {{ correctRate(record) }}%
              </div>
            </div>
            <div class="text-2xl">
              {{ correctRate(record) >= 80 ? '🌟' : correctRate(record) >= 60 ? '👍' : '💪' }}
            </div>
          </div>

          <!-- 展开详情 -->
          <div v-if="expandedId === record.id && detailMap[record.id]" class="mt-3 pt-3 border-t border-amber-100">
            <div v-if="detailMap[record.id].loading" class="text-gray-400 text-sm">加载中…</div>
            <template v-else>
              <div class="mb-2">
                <span class="text-green-500 font-bold text-sm">✅ 一次通过：</span>
                <span class="text-gray-600 text-sm">
                  {{ getFirstRoundChars(detailMap[record.id].details) || '无' }}
                </span>
              </div>
              <div>
                <span class="text-orange-400 font-bold text-sm">💪 练习后通过：</span>
                <span class="text-gray-600 text-sm">
                  {{ getReviewChars(detailMap[record.id].details) || '无' }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex justify-around py-3 px-4">
      <router-link to="/" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">🏠</span>
        <span class="text-xs mt-1">首页</span>
      </router-link>
      <router-link to="/history" class="flex flex-col items-center text-orange-400">
        <span class="text-2xl">📅</span>
        <span class="text-xs mt-1">历史</span>
      </router-link>
      <router-link to="/admin" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">⚙️</span>
        <span class="text-xs mt-1">管理</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchCheckins, fetchCheckinDetail } from '../api/index.js'

const records = ref([])
const isLoading = ref(false)
const expandedId = ref(null)
const detailMap = ref({})

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-indexed

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentYearMonth = computed(() =>
  `${viewYear.value} 年 ${viewMonth.value + 1} 月`
)

const checkinDateSet = computed(() => new Set(records.value.map((r) => r.checkin_date)))

const calendarCells = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, date: null })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ day, date: dateStr })
  }
  return cells
})

function getCellClass(cell) {
  if (!cell.date) return 'invisible'
  const isToday = cell.date === today.toISOString().slice(0, 10)
  const isChecked = checkinDateSet.value.has(cell.date)
  if (isChecked) return 'bg-orange-400 text-white'
  if (isToday) return 'bg-amber-100 text-orange-500 ring-2 ring-orange-300'
  return 'text-gray-600 hover:bg-amber-50'
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function selectDate(dateStr) {
  const record = records.value.find((r) => r.checkin_date === dateStr)
  if (record) toggleDetail(record.id)
}

async function toggleDetail(recordId) {
  if (expandedId.value === recordId) {
    expandedId.value = null
    return
  }
  expandedId.value = recordId
  if (!detailMap.value[recordId]) {
    detailMap.value[recordId] = { loading: true, details: [] }
    try {
      const response = await fetchCheckinDetail(recordId)
      detailMap.value[recordId] = { loading: false, details: response.data.details }
    } catch {
      detailMap.value[recordId] = { loading: false, details: [] }
    }
  }
}

function correctRate(record) {
  if (!record.challenge_count) return 0
  return Math.round((record.correct_count / record.challenge_count) * 100)
}

function getFirstRoundChars(details) {
  return details.filter((d) => d.round_correct === 1).map((d) => d.character).join(' ')
}

function getReviewChars(details) {
  return details.filter((d) => d.round_correct > 1 && d.is_correct === 1).map((d) => d.character).join(' ')
}

onMounted(async () => {
  isLoading.value = true
  try {
    const response = await fetchCheckins()
    records.value = response.data
  } finally {
    isLoading.value = false
  }
})
</script>
