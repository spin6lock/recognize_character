import axios from 'axios'

const token = window.location.pathname.split('/')[2] || ''
const base = token ? `/t/${token}/api` : '/api'

const http = axios.create({ baseURL: base, timeout: 30000 })

let currentAudio = null

/**
 * 使用后端 edge-tts 朗读汉字（普通话）
 */
export function speakText(text, rate = 0.8) {
  stopSpeaking()
  const url = `${base}/tts/${encodeURIComponent(text)}`
  currentAudio = new Audio(url)
  currentAudio.playbackRate = rate
  currentAudio.play().catch(() => {})
}

/**
 * 停止当前朗读
 */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

/**
 * 检查浏览器是否支持语音识别
 */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * 创建语音识别实例（普通话）
 */
export function createSpeechRecognizer(onResult, onEnd, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 5

  recognition.onresult = (event) => {
    const results = []
    for (let i = 0; i < event.results[0].length; i++) {
      results.push(event.results[0][i].transcript.trim())
    }
    onResult(results)
  }

  recognition.onend = onEnd
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
      onError?.(event.error)
    }
    onEnd()
  }

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  }
}
