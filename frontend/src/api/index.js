import axios from 'axios'

const token = window.location.pathname.split('/')[2] || ''
const base = token ? `/t/${token}/api` : '/api'

const http = axios.create({
  baseURL: base,
  timeout: 10000,
})

// ── 字库 ──────────────────────────────────────────────

export const fetchWords = (params) => http.get('/words', { params })

export const batchAddWords = (characters, learnDate) =>
  http.post('/words/batch', { characters, learn_date: learnDate })

export const updateWord = (id, learnDate) =>
  http.put(`/words/${id}`, { learn_date: learnDate })

export const deleteWord = (id) => http.delete(`/words/${id}`)

export const fetchRandomWords = (count) =>
  http.get('/words/random', { params: { count } })

// ── 打卡记录 ──────────────────────────────────────────

export const fetchCheckins = () => http.get('/checkin')

export const submitCheckin = (payload) => http.post('/checkin', payload)

export const fetchCheckinDetail = (id) => http.get(`/checkin/${id}`)

export const fetchStreak = () => http.get('/checkin/streak')

// ── 提示录音 ──────────────────────────────────────────

export const fetchAudioList = (type) => http.get(`/audio/${type}`)

export const fetchRandomAudio = (type) => http.get(`/audio/${type}/random`)

export const uploadAudio = (type, blob) => {
  const ext = blob.type.includes('mp4') || blob.type.includes('aac') ? 'm4a' : 'webm'
  const formData = new FormData()
  formData.append('type', type)
  formData.append('file', blob, `${type}_${Date.now()}.${ext}`)
  return http.post('/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
}

export const deleteAudio = (id) => http.delete(`/audio/${id}`)

// ── 配置 ──────────────────────────────────────────────

export const fetchConfig = () => http.get('/config')
