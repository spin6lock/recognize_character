import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 答题会话状态，支持 localStorage 持久化（断网恢复用）
 */
export const useSessionStore = defineStore('session', () => {
  const words = ref([])           // 本轮抽取的字
  const currentIndex = ref(0)     // 当前答题索引
  const details = ref([])         // 答题明细
  const startTime = ref(null)     // 开始时间戳
  const challengeCount = ref(0)   // 本次挑战字数

  const currentWord = computed(() => words.value[currentIndex.value] ?? null)

  const wrongWords = computed(() =>
    details.value
      .filter((detail) => detail.wrong_times > 0 && detail.is_correct === 0)
      .map((detail) => words.value.find((word) => word.character === detail.character))
      .filter(Boolean)
  )

  const correctCount = computed(() =>
    details.value.filter((detail) => detail.is_correct === 1).length
  )

  const wrongCount = computed(() =>
    details.value.filter((detail) => detail.is_correct === 0).length
  )

  function startSession(selectedWords) {
    words.value = selectedWords
    currentIndex.value = 0
    challengeCount.value = selectedWords.length
    startTime.value = Date.now()
    details.value = selectedWords.map((word) => ({
      character: word.character,
      is_correct: 0,
      wrong_times: 0,
      round_correct: 0,
    }))
    persistToStorage()
  }

  function markCorrect(character, roundNumber) {
    const detail = details.value.find((d) => d.character === character)
    if (detail) {
      detail.is_correct = 1
      detail.round_correct = roundNumber
    }
    persistToStorage()
  }

  function markWrong(character) {
    const detail = details.value.find((d) => d.character === character)
    if (detail) {
      detail.wrong_times += 1
    }
    persistToStorage()
  }

  function nextWord() {
    currentIndex.value += 1
    persistToStorage()
  }

  function getDurationSeconds() {
    if (!startTime.value) return 0
    return Math.round((Date.now() - startTime.value) / 1000)
  }

  function buildCheckinPayload(totalRounds) {
    const today = new Date().toISOString().slice(0, 10)
    return {
      checkin_date: today,
      challenge_count: challengeCount.value,
      correct_count: correctCount.value,
      wrong_count: wrongCount.value,
      total_rounds: totalRounds,
      duration: getDurationSeconds(),
      details: details.value,
    }
  }

  function persistToStorage() {
    localStorage.setItem(
      'quiz_session',
      JSON.stringify({
        words: words.value,
        currentIndex: currentIndex.value,
        details: details.value,
        startTime: startTime.value,
        challengeCount: challengeCount.value,
      })
    )
  }

  function restoreFromStorage() {
    const saved = localStorage.getItem('quiz_session')
    if (!saved) return false
    try {
      const data = JSON.parse(saved)
      words.value = data.words ?? []
      currentIndex.value = data.currentIndex ?? 0
      details.value = data.details ?? []
      startTime.value = data.startTime ?? null
      challengeCount.value = data.challengeCount ?? 0
      return true
    } catch {
      return false
    }
  }

  function clearSession() {
    words.value = []
    currentIndex.value = 0
    details.value = []
    startTime.value = null
    challengeCount.value = 0
    localStorage.removeItem('quiz_session')
  }

  return {
    words,
    currentIndex,
    details,
    startTime,
    challengeCount,
    currentWord,
    wrongWords,
    correctCount,
    wrongCount,
    startSession,
    markCorrect,
    markWrong,
    nextWord,
    getDurationSeconds,
    buildCheckinPayload,
    restoreFromStorage,
    clearSession,
  }
})
