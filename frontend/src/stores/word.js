import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchWords } from '../api/index.js'

export const useWordStore = defineStore('word', () => {
  const words = ref([])
  const totalCount = ref(0)
  const isLoading = ref(false)

  async function loadWords(params = {}) {
    isLoading.value = true
    try {
      const response = await fetchWords(params)
      words.value = response.data
      totalCount.value = response.data.length
    } finally {
      isLoading.value = false
    }
  }

  return { words, totalCount, isLoading, loadWords }
})
