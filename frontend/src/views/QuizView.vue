<template>
  <div class="min-h-screen flex flex-col bg-amber-50 select-none">
    <!-- 顶部进度区 -->
    <div class="px-4 pt-6 pb-3 bg-white shadow-sm">
      <div class="flex justify-between items-center mb-2 text-sm font-bold">
        <span class="text-green-500">✅ {{ sessionStore.correctCount }}</span>
        <span class="text-gray-500">{{ currentPosition }} / {{ sessionStore.challengeCount }}</span>
        <span class="text-red-400">❌ {{ sessionStore.wrongCount }}</span>
      </div>
      <ProgressBar :current="currentPosition" :total="sessionStore.challengeCount" />
    </div>

    <!-- 汉字展示区 -->
    <div class="flex-1 flex flex-col items-center justify-center px-4">
      <div
        ref="characterRef"
        @click="speakCurrentWord"
        class="text-[120px] leading-none cursor-pointer mb-4 transition-transform"
        :class="characterAnimation"
      >
        {{ sessionStore.currentWord?.character }}
      </div>
      <p class="text-gray-400 text-base mb-4">点击汉字听读音 🔊</p>

      <!-- 语音识别按钮 -->
      <button
        v-if="sttSupported && !sttListening && !sttResult"
        @pointerdown="startSTT"
        @pointerup="stopSTT"
        @pointerleave="stopSTT"
        class="w-16 h-16 rounded-full bg-blue-400 text-white text-2xl shadow-lg active:scale-95 transition-transform select-none touch-none"
      >
        🎤
      </button>

      <!-- 识别中 -->
      <div v-if="sttListening" class="flex flex-col items-center gap-2">
        <div class="w-16 h-16 rounded-full bg-red-400 text-white text-2xl flex items-center justify-center animate-pulse shadow-lg">
          🔴
        </div>
        <p class="text-red-400 font-bold text-sm">请说出这个字…</p>
      </div>

      <!-- 识别结果 -->
      <div
        v-if="sttResult"
        @click="dismissSTTResult"
        class="flex flex-col items-center gap-1 cursor-pointer"
        :class="{ 'stt-anim': !sttAnimEnd }"
      >
        <div class="text-3xl">{{ sttResult.correct ? '✅ 读对了！' : '❌ 再试试' }}</div>
        <p class="text-gray-400 text-sm">识别到：{{ sttResult.text }}</p>
        <p class="text-gray-300 text-xs">点击关闭</p>
      </div>

      <p v-if="sttSupported && !sttListening && !sttResult" class="text-gray-300 text-xs mt-2">按住麦克风朗读汉字</p>
    </div>

    <!-- 答题按钮 -->
    <div class="px-6 pb-12 flex gap-4">
      <button
        @click="handleAnswer(true)"
        :disabled="isAnswering"
        class="flex-1 py-5 rounded-3xl text-2xl font-bold text-white bg-green-400 shadow-lg btn-bounce"
      >
        ✅ 认识
      </button>
      <button
        @click="handleAnswer(false)"
        :disabled="isAnswering"
        class="flex-1 py-5 rounded-3xl text-2xl font-bold text-white bg-orange-400 shadow-lg btn-bounce"
      >
        ❌ 不认识
      </button>
    </div>

    <!-- 撒花动画 -->
    <ConfettiEffect ref="confettiRef" />

    <!-- 答对/答错提示浮层 -->
    <transition name="feedback">
      <div
        v-if="feedbackVisible"
        class="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
      >
        <div
          class="text-6xl"
          :class="lastCorrect ? 'animate-bounce' : 'shake'"
        >
          {{ lastCorrect ? '🌟' : '💪' }}
        </div>
      </div>
    </transition>
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
const characterRef = ref(null)
const isAnswering = ref(false)
const feedbackVisible = ref(false)
const lastCorrect = ref(true)
const characterAnimation = ref('')

// 语音识别相关
const sttSupported = isSpeechRecognitionSupported()
const sttListening = ref(false)
const sttResult = ref(null) // null | { correct: boolean, text: string }
const sttAnimEnd = ref(false)
let recognizer = null

if (sttSupported) {
  recognizer = createSpeechRecognizer(
    (alternatives) => {
      const target = sessionStore.currentWord?.character
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
  sttAnimEnd.value = false
  sttListening.value = true
  recognizer.start()
}

function stopSTT() {
  if (recognizer && sttListening.value) {
    recognizer.stop()
  }
}

function dismissSTTResult() {
  sttResult.value = null
  sttAnimEnd.value = false
}

const currentPosition = computed(() => sessionStore.currentIndex + 1)

function speakCurrentWord() {
  if (sessionStore.currentWord) {
    speakText(sessionStore.currentWord.character)
  }
}

async function playPromptAudio(type) {
  try {
    const response = await fetchRandomAudio(type)
    if (response.data?.audio_url) {
      const audio = new Audio(response.data.audio_url)
      audio.play().catch(() => {})
    }
  } catch {
    // 没有录音时静默忽略
  }
}

async function handleAnswer(isCorrect) {
  if (isAnswering.value || !sessionStore.currentWord) return
  isAnswering.value = true

  const character = sessionStore.currentWord.character
  lastCorrect.value = isCorrect

  if (isCorrect) {
    sessionStore.markCorrect(character, 1)
    characterAnimation.value = 'bounce-in'
    confettiRef.value?.fire()
    await playPromptAudio('correct')
  } else {
    sessionStore.markWrong(character)
    characterAnimation.value = 'shake'
    await playPromptAudio('wrong')
    // 答错后 TTS 再读一遍
    setTimeout(() => speakText(character), 600)
  }

  // 显示反馈图标
  feedbackVisible.value = true
  setTimeout(() => {
    feedbackVisible.value = false
    characterAnimation.value = ''
  }, 800)

  // 延迟跳下一题
  setTimeout(() => {
    sessionStore.nextWord()
    isAnswering.value = false

    if (sessionStore.currentIndex >= sessionStore.challengeCount) {
      goToNextPhase()
    }
  }, 900)
}

function goToNextPhase() {
  const hasWrongWords = sessionStore.details.some(
    (detail) => detail.is_correct === 0
  )
  if (hasWrongWords) {
    router.push('/review')
  } else {
    router.push('/complete')
  }
}

onMounted(() => {
  if (!sessionStore.currentWord) {
    router.replace('/')
  }
})

onUnmounted(() => {
  stopSTT()
})
</script>

<style scoped>
.feedback-enter-active,
.feedback-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
.stt-anim {
  animation: stt-pop 0.4s ease;
}
@keyframes stt-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
