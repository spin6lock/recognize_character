<template>
  <div class="min-h-screen bg-amber-50 pb-24">
    <!-- 顶部 -->
    <div class="bg-white px-4 pt-8 pb-4 shadow-sm">
      <h1 class="text-2xl font-bold text-orange-500 text-center">⚙️ 后台管理</h1>
      <!-- Tab 切换 -->
      <div class="flex mt-4 bg-amber-100 rounded-2xl p-1">
        <button
          @click="activeTab = 'words'"
          class="flex-1 py-2 rounded-xl font-bold text-sm transition-colors"
          :class="activeTab === 'words' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'"
        >
          📚 字库管理
        </button>
        <button
          @click="activeTab = 'audio'"
          class="flex-1 py-2 rounded-xl font-bold text-sm transition-colors"
          :class="activeTab === 'audio' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'"
        >
          🎙️ 提示录音
        </button>
      </div>
    </div>

    <!-- 字库管理 Tab -->
    <div v-if="activeTab === 'words'" class="px-4 mt-4">
      <!-- 批量添加 -->
      <div class="bg-white rounded-3xl shadow-md p-4 mb-4">
        <h2 class="font-bold text-gray-700 mb-3">批量添加汉字</h2>
        <textarea
          v-model="batchInput"
          placeholder="输入汉字，用空格分隔，如：你 好 学 习"
          class="w-full border-2 border-amber-200 rounded-2xl p-3 text-lg resize-none focus:outline-none focus:border-orange-400"
          rows="3"
        />
        <div class="flex items-center gap-3 mt-3">
          <input
            v-model="batchLearnDate"
            type="date"
            class="flex-1 border-2 border-amber-200 rounded-2xl px-3 py-2 focus:outline-none focus:border-orange-400"
          />
          <button
            @click="handleBatchAdd"
            :disabled="!batchInput.trim() || isAdding"
            class="px-6 py-2 rounded-2xl font-bold text-white bg-orange-400 btn-bounce disabled:opacity-50"
          >
            {{ isAdding ? '添加中…' : '添加' }}
          </button>
        </div>
        <p v-if="addMessage" class="text-sm mt-2" :class="addSuccess ? 'text-green-500' : 'text-red-400'">
          {{ addMessage }}
        </p>
      </div>

      <!-- 搜索筛选 -->
      <div class="bg-white rounded-3xl shadow-md p-4 mb-4">
        <div class="flex gap-2">
          <input
            v-model="searchKeyword"
            placeholder="搜索汉字…"
            class="flex-1 border-2 border-amber-200 rounded-2xl px-3 py-2 focus:outline-none focus:border-orange-400"
          />
          <button @click="loadWords" class="px-4 py-2 rounded-2xl bg-amber-100 text-orange-500 font-bold btn-bounce">
            🔍
          </button>
        </div>
      </div>

      <!-- 字库列表 -->
      <div class="bg-white rounded-3xl shadow-md overflow-hidden">
        <div v-if="wordStore.isLoading" class="text-center text-gray-400 py-8">加载中…</div>
        <div v-else-if="wordStore.words.length === 0" class="text-center text-gray-400 py-8">
          字库为空，快去添加汉字吧！
        </div>
        <div v-else>
          <div
            v-for="word in wordStore.words"
            :key="word.id"
            class="flex items-center px-4 py-3 border-b border-amber-50 last:border-0"
          >
            <div class="text-3xl font-bold text-orange-500 w-12">{{ word.character }}</div>
            <div class="flex-1 ml-3">
              <div class="text-gray-600 font-bold">{{ word.pinyin }}</div>
              <div v-if="editingWordId !== word.id" class="text-gray-400 text-sm">
                {{ word.learn_date || '未设置学习日期' }}
              </div>
              <input
                v-else
                v-model="editingDate"
                type="date"
                class="border border-amber-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
                @blur="saveWordDate(word.id)"
                @keyup.enter="saveWordDate(word.id)"
              />
            </div>
            <div class="flex gap-2">
              <button
                @click="startEditDate(word)"
                class="text-blue-400 text-sm px-2 py-1 rounded-lg hover:bg-blue-50"
              >
                ✏️
              </button>
              <button
                @click="handleDeleteWord(word.id)"
                class="text-red-400 text-sm px-2 py-1 rounded-lg hover:bg-red-50"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示录音 Tab -->
    <div v-if="activeTab === 'audio'" class="px-4 mt-4">
      <div
        v-for="audioType in audioTypes"
        :key="audioType.type"
        class="bg-white rounded-3xl shadow-md p-4 mb-4"
      >
        <h2 class="font-bold text-gray-700 mb-1">{{ audioType.label }}</h2>
        <p class="text-gray-400 text-sm mb-4">{{ audioType.hint }}</p>

        <!-- 录音组件 -->
        <AudioRecorder
          :audio-type="audioType.type"
          @saved="onAudioSaved(audioType.type)"
        />

        <!-- 已有录音列表 -->
        <div v-if="audioLists[audioType.type]?.length" class="mt-4 border-t border-amber-100 pt-3">
          <p class="text-gray-400 text-xs mb-2">已录制 {{ audioLists[audioType.type].length }} 条</p>
          <div class="flex flex-col gap-2">
            <div
              v-for="audio in audioLists[audioType.type]"
              :key="audio.id"
              class="flex items-center gap-2"
            >
              <audio :src="audio.audio_url" controls class="flex-1 h-8 rounded-lg" />
              <button
                @click="handleDeleteAudio(audioType.type, audio.id)"
                class="text-red-400 text-sm px-2 py-1 rounded-lg hover:bg-red-50 shrink-0"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-300 text-sm mt-3 text-center">还没有录音，快去录制吧！</p>
      </div>
    </div>

    <!-- 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex justify-around py-3 px-4">
      <router-link to="/" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">🏠</span>
        <span class="text-xs mt-1">首页</span>
      </router-link>
      <router-link to="/history" class="flex flex-col items-center text-gray-400">
        <span class="text-2xl">📅</span>
        <span class="text-xs mt-1">历史</span>
      </router-link>
      <router-link to="/admin" class="flex flex-col items-center text-orange-400">
        <span class="text-2xl">⚙️</span>
        <span class="text-xs mt-1">管理</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useWordStore } from '../stores/word.js'
import {
  batchAddWords,
  updateWord,
  deleteWord,
  fetchAudioList,
  deleteAudio,
} from '../api/index.js'
import AudioRecorder from '../components/AudioRecorder.vue'

const wordStore = useWordStore()
const activeTab = ref('words')

// ── 字库管理 ──────────────────────────────────────────

const batchInput = ref('')
const batchLearnDate = ref('')
const isAdding = ref(false)
const addMessage = ref('')
const addSuccess = ref(true)
const searchKeyword = ref('')
const editingWordId = ref(null)
const editingDate = ref('')

async function loadWords() {
  const params = {}
  if (searchKeyword.value) params.search = searchKeyword.value
  await wordStore.loadWords(params)
}

async function handleBatchAdd() {
  if (!batchInput.value.trim()) return
  isAdding.value = true
  addMessage.value = ''
  try {
    const response = await batchAddWords(batchInput.value, batchLearnDate.value || null)
    const count = response.data.length
    addSuccess.value = true
    addMessage.value = count > 0 ? `成功添加 ${count} 个汉字！` : '所有汉字已存在于字库中'
    batchInput.value = ''
    await loadWords()
  } catch {
    addSuccess.value = false
    addMessage.value = '添加失败，请重试'
  } finally {
    isAdding.value = false
  }
}

function startEditDate(word) {
  editingWordId.value = word.id
  editingDate.value = word.learn_date ?? ''
}

async function saveWordDate(wordId) {
  try {
    await updateWord(wordId, editingDate.value || null)
    await loadWords()
  } catch {
    // 静默忽略
  } finally {
    editingWordId.value = null
  }
}

async function handleDeleteWord(wordId) {
  if (!confirm('确认删除这个字吗？')) return
  try {
    await deleteWord(wordId)
    await loadWords()
  } catch {
    alert('删除失败，请重试')
  }
}

// ── 提示录音 ──────────────────────────────────────────

const audioTypes = [
  { type: 'correct', label: '✅ 答对提示', hint: '例：哇好棒！答对了！' },
  { type: 'wrong', label: '❌ 答错提示', hint: '例：没关系，再想想！' },
  { type: 'complete', label: '🎉 完成提示', hint: '例：今天表现真棒！' },
]

const audioLists = ref({ correct: [], wrong: [], complete: [] })

async function loadAllAudio() {
  await Promise.all(
    audioTypes.map(async ({ type }) => {
      try {
        const response = await fetchAudioList(type)
        audioLists.value[type] = response.data
      } catch {
        audioLists.value[type] = []
      }
    })
  )
}

async function onAudioSaved(type) {
  try {
    const response = await fetchAudioList(type)
    audioLists.value[type] = response.data
  } catch {
    // 静默忽略
  }
}

async function handleDeleteAudio(type, audioId) {
  if (!confirm('确认删除这条录音吗？')) return
  try {
    await deleteAudio(audioId)
    audioLists.value[type] = audioLists.value[type].filter((a) => a.id !== audioId)
  } catch {
    alert('删除失败，请重试')
  }
}

onMounted(async () => {
  await Promise.all([loadWords(), loadAllAudio()])
})
</script>
