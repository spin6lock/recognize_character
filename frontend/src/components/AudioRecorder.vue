<template>
  <div class="flex flex-col items-center gap-4">
    <!-- 录音按钮 -->
    <button
      v-if="state === 'idle'"
      @click="startRecording"
      class="w-24 h-24 rounded-full bg-orange-400 text-white text-4xl shadow-lg active:scale-95 transition-transform select-none touch-none"
    >
      🎙️
    </button>

    <!-- 录音中 -->
    <div v-if="state === 'recording'" class="flex flex-col items-center gap-2">
      <button
        @click="stopRecording"
        class="w-24 h-24 rounded-full bg-red-500 text-white text-4xl flex items-center justify-center animate-pulse shadow-lg"
      >
        ⬛
      </button>
      <p class="text-red-500 font-bold">录音中…点击停止</p>
    </div>

    <!-- 回放确认 -->
    <div v-if="state === 'reviewing'" class="flex flex-col items-center gap-3 w-full">
      <audio ref="audioRef" :src="previewUrl" controls class="w-full rounded-xl" />
      <div class="flex gap-3 w-full">
        <button
          @click="confirmSave"
          class="flex-1 py-3 rounded-2xl bg-green-400 text-white font-bold text-lg btn-bounce"
        >
          ✅ 保存
        </button>
        <button
          @click="resetRecorder"
          class="flex-1 py-3 rounded-2xl bg-gray-300 text-gray-700 font-bold text-lg btn-bounce"
        >
          🔄 重录
        </button>
      </div>
    </div>

    <!-- 上传中 -->
    <div v-if="state === 'uploading'" class="text-orange-400 font-bold animate-pulse">
      上传中…
    </div>

    <p v-if="state === 'idle'" class="text-gray-400 text-sm">点击麦克风开始录音</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uploadAudio } from '../api/index.js'

const props = defineProps({
  audioType: { type: String, required: true }, // correct / wrong / complete
})

const emit = defineEmits(['saved'])

const state = ref('idle')       // idle | recording | reviewing | uploading
const previewUrl = ref('')
const audioRef = ref(null)

let mediaRecorder = null
let recordedChunks = []
let recordedBlob = null

async function startRecording() {
  if (state.value !== 'idle') return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: 'audio/webm' })
      previewUrl.value = URL.createObjectURL(recordedBlob)
      stream.getTracks().forEach((track) => track.stop())
      state.value = 'reviewing'
    }
    mediaRecorder.start()
    state.value = 'recording'
  } catch {
    alert('无法访问麦克风，请检查权限设置')
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
}

async function confirmSave() {
  if (!recordedBlob) return
  state.value = 'uploading'
  try {
    const response = await uploadAudio(props.audioType, recordedBlob)
    emit('saved', response.data)
    resetRecorder()
  } catch {
    alert('上传失败，请重试')
    state.value = 'reviewing'
  }
}

function resetRecorder() {
  state.value = 'idle'
  previewUrl.value = ''
  recordedBlob = null
  recordedChunks = []
}
</script>
