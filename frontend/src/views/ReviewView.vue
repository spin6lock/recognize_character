<template>
  <div class="min-h-screen flex flex-col bg-amber-50 px-4 py-8">
    <!-- 标题 -->
    <div class="text-center mb-6">
      <div class="text-5xl mb-2">💪</div>
      <h1 class="text-2xl font-bold text-orange-500">错题复习</h1>
      <p class="text-gray-400 text-sm mt-1">再练一遍，一定能记住！</p>
    </div>

    <!-- 错题列表（复习前展示） -->
    <div v-if="phase === 'preview'" class="w-full max-w-sm mx-auto">
      <div class="bg-white rounded-3xl shadow-md p-5 mb-6">
        <h2 class="font-bold text-gray-600 mb-3">本轮错题（{{ wrongWords.length }} 个）</h2>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="word in wrongWords"
            :key="word.character"
            @click="speakText(word.character)"
            class="flex flex-col items-center bg-amber-50 rounded-2xl px-4 py-3 cursor-pointer"
          >
            <span class="text-3xl font-bold text-orange-500">{{ word.character }}</span>
            <span class="text-xs text-gray-400 mt-1">{{ word.pinyin }}</span>
          </div>
        </div>
      </div>
      <button
        @click="startReview"
        class="w-full py-5 rounded-full text-xl font-bold text-white bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg btn-bounce"
      >
        开始复习 🚀
      </button>
      <button
        @click="skipToComplete"
        class="w-full mt-3 py-4 rounded-full text-lg font-bold text-gray-400 bg-gray-100 btn-bounce"
      >
        跳过，直接完成
      </button>
    </div>

    <!-- 复习答题 -->
    <div v-if="phase === 'quiz'" class="flex flex-col items-center flex-1">
      <div class="w-full max-w-sm mb-4">
        <ProgressBar :current="reviewIndex + 1" :total="reviewWords.length" />
        <p class="text-center text-gray-400 text-sm mt-2">
          {{ reviewIndex + 1 }} / {{ reviewWords.length }}
        </p>
      </div>

      <div
        @click="speakText(currentReviewWord?.character)"
        class="text-[100px] leading-none cursor-pointer mb-4"
        :class="characterAnimation"
      >
        {{ currentReviewWord?.character }}
      </div>
      <p class="text-gray-400 text-sm mb-4">点击汉字听读音 🔊</p>

      <!-- 语音识别 -->
      <button
        v-if="sttSupported && !sttListening && !sttResult"
        @pointerdown="startSTT"
        @pointerup="stopSTT"
        @pointerleave="stopSTT"
        class="w-14 h-14 rounded-full bg-blue-400 text-white text-xl shadow-lg active:scale-95 transition-transform select-none touch-none mb-2"
      >
        🎤
      </button>
      <div v-if="sttListening" class="flex flex-col items-center gap-1 mb-2">
        <div class="w-14 h-14 rounded-full bg-red-400 text-white text-xl flex items-center justify-center animate-pulse shadow-lg">🔴</div>
        <p class="text-red-400 font-bold text-xs">请说出这个字…</p>
      </div>
      <div v-if="sttResult" @click="dismissSTTResult" class="flex flex-col items-center gap-1 cursor-pointer mb-2">
        <div class="text-2xl">{{ sttResult.correct ? '✅ 读对了！' : '❌ 再试试' }}</div>
        <p class="text-gray-400 text-xs">识别到：{{ sttResult.text }}</p>
      </div>

      <div class="flex gap-4 w-full max-w-sm">
        <button
          @click="handleReviewAnswer(true)"
          :disabled="isAnswering"
          class="flex-1 py-5 rounded-3xl text-xl font-bold text-white bg-green-400 shadow-lg btn-bounce"
        >
          ✅ 认识
        </button>
        <button
          @click="handleReviewAnswer(false)"
          :disabled="isAnswering"
          class="flex-1 py-5 rounded-3xl text-xl font-bold text-white bg-orange-400 shadow-lg btn-bounce"
        >
          ❌ 不认识
        </button>
      </div>
    </div>

    <!-- 撒花 -->
    <ConfettiEffect ref="confettiRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session.js'
import { fetchRandomAudio } from '../api/index.js'
import { speakText, isSpeechRecognitionSupported, createSpeechRecognizer } from '../utils/tts.js'
import ProgressBar from '../components/ProgressBar.vue'
import ConfettiEffect from '../components/ConfettiEffect.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const confettiRef = ref(null)

const phase = ref('preview')   // preview | quiz
const reviewWords = ref([])
const reviewIndex = ref(0)
const isAnswering = ref(false)
const characterAnimation = ref('')
const roundNumber = ref(2)     // 第几轮（第一轮是主答题，复习从第2轮开始）

// 语音识别
const sttSupported = isSpeechRecognitionSupported()
const sttListening = ref(false)
const sttResult = ref(null)
let recognizer = null

if (sttSupported) {
  recognizer = createSpeechRecognizer(
    (alternatives) => {
      const target = currentReviewWord.value?.character
      if (!target) return
      const matched = alternatives.some((text) => text.includes(target))
      sttResult.value = { correct: matched, text: alternatives[0] }
    },
    () => { sttListening.value = false },
    () => { sttListening.value = false },
  )
}

function startSTT() {
  if (!recognizer || sttListening.value || isAnswering.value) return
  sttResult.value = null
  sttListening.value = true
  recognizer.start()
}

function stopSTT() {
  if (recognizer && sttListening.value) recognizer.stop()
}

function dismissSTTResult() {
  sttResult.value = null
}

const wrongWords = computed(() =>
  sessionStore.details
    .filter((detail) => detail.is_correct === 0)
    .map((detail) =>
      sessionStore.words.find((word) => word.character === detail.character)
    )
    .filter(Boolean)
)

const currentReviewWord = computed(() => reviewWords.value[reviewIndex.value] ?? null)

function startReview() {
  reviewWords.value = [...wrongWords.value]
  reviewIndex.value = 0
  phase.value = 'quiz'
}

async function playPromptAudio(type) {
  try {
    const response = await fetchRandomAudio(type)
    if (response.data?.audio_url) {
      const audio = new Audio(response.data.audio_url)
      audio.play().catch(() => {})
    }
  } catch {
    // 静默忽略
  }
}

async function handleReviewAnswer(isCorrect) {
  if (isAnswering.value || !currentReviewWord.value) return
  isAnswering.value = true

  const character = currentReviewWord.value.character

  if (isCorrect) {
    sessionStore.markCorrect(character, roundNumber.value)
    characterAnimation.value = 'bounce-in'
    confettiRef.value?.fire()
    await playPromptAudio('correct')
  } else {
    sessionStore.markWrong(character)
    characterAnimation.value = 'shake'
    await playPromptAudio('wrong')
    setTimeout(() => speakText(character), 600)
  }

  setTimeout(() => {
    characterAnimation.value = ''
  }, 500)

  setTimeout(() => {
    reviewIndex.value += 1
    isAnswering.value = false

    if (reviewIndex.value >= reviewWords.value.length) {
      // 本轮复习结束，检查是否还有错题
      const stillWrong = sessionStore.details.filter((d) => d.is_correct === 0)
      if (stillWrong.length > 0) {
        // 还有错题，再来一轮
        roundNumber.value += 1
        reviewWords.value = stillWrong
          .map((d) => sessionStore.words.find((w) => w.character === d.character))
          .filter(Boolean)
        reviewIndex.value = 0
        phase.value = 'preview'
      } else {
        router.push('/complete')
      }
    } else {
      speakText(currentReviewWord.value?.character ?? '')
    }
  }, 900)
}

function skipToComplete() {
  router.push('/complete')
}

onMounted(() => {
  if (wrongWords.value.length === 0) {
    router.replace('/complete')
  }
})

onUnmounted(() => {
  stopSTT()
})
</script>
