/**
 * 使用浏览器原生 Web Speech API 朗读汉字
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
