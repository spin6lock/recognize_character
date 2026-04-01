/**
 * 缓存普通话语音，iOS 上 voices 异步加载
 */
let cachedMandarinVoice = null
let voicesLoaded = false

function isCantoneseVoice(v) {
  return /cantonese|yue|粤/i.test(v.name + v.lang)
}

function selectMandarinVoice(voices) {
  // 过滤掉粤语 voice
  const safe = voices.filter((v) => !isCantoneseVoice(v))
  return (
    // 精确匹配 cmn 普通话标签
    safe.find((v) => v.lang.startsWith('cmn')) ||
    // zh-Hans 简体中文 = 普通话
    safe.find((v) => v.lang === 'zh-Hans' || v.lang === 'zh-Hans-CN') ||
    // zh-CN + 名字含 Mandarin/Ting
    safe.find((v) => v.lang === 'zh-CN' && /mandarin|ting/i.test(v.name)) ||
    // 任何 zh-CN
    safe.find((v) => v.lang === 'zh-CN') ||
    // 名字含普通话
    safe.find((v) => /普通话|Mandarin|Ting-Ting|Yu-Shu/i.test(v.name)) ||
    null
  )
}

function loadVoices() {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    cachedMandarinVoice = selectMandarinVoice(voices)
    voicesLoaded = true
  }
}

// 首次尝试加载
loadVoices()

// 监听 voices 变化（iOS/Chrome 异步加载）
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices
}

/**
 * 使用浏览器原生 Web Speech API 朗读汉字（普通话）
 */
export function speakText(text, rate = 0.8) {
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()

  if (!voicesLoaded) loadVoices()

  const utterance = new SpeechSynthesisUtterance(text)
  // 使用 zh-Hans-CN 避免 iOS 匹配到粤语
  utterance.lang = 'zh-Hans-CN'
  utterance.rate = rate
  utterance.pitch = 1.1

  if (cachedMandarinVoice) utterance.voice = cachedMandarinVoice

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
