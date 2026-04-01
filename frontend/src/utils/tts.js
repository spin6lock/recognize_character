/**
 * 获取普通话语音（优先 zh-CN Mandarin）
 */
function getMandarinVoice() {
  const voices = window.speechSynthesis.getVoices()
  // 优先级：zh-CN > cmn-Hans > 普通话关键字
  return (
    voices.find((v) => v.lang === 'zh-CN' && v.name.includes('Mandarin')) ||
    voices.find((v) => v.lang === 'zh-CN') ||
    voices.find((v) => v.lang.startsWith('cmn')) ||
    voices.find((v) => v.name.includes('普通话') || v.name.includes('Mandarin')) ||
    null
  )
}

/**
 * 使用浏览器原生 Web Speech API 朗读汉字（普通话）
 * @param {string} text - 要朗读的文字
 * @param {number} rate - 语速，默认 0.8（适合儿童）
 */
export function speakText(text, rate = 0.8) {
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = rate
  utterance.pitch = 1.1

  const voice = getMandarinVoice()
  if (voice) utterance.voice = voice

  window.speechSynthesis.speak(utterance)
}

/**
 * 停止当前朗读
 */
export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
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
 * @param {(transcript: string) => void} onResult - 识别结果回调
 * @param {() => void} onEnd - 识别结束回调
 * @param {(error: string) => void} onError - 错误回调
 * @returns {{ start: () => void, stop: () => void }}
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
