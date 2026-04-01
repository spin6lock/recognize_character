---
name: iOS TTS 粤语问题记录
description: iOS 18+ Safari Web Speech API 普通话读成粤语的已知 bug 及解决方案
type: reference
---

# iOS TTS 粤语问题

## 问题
iOS 18+ Safari 的 Web Speech API (`speechSynthesis`) 将 `zh-CN` 普通话读成粤语。
这是 Apple `AVSpeechSynthesizer` 的已知 bug，影响 iOS 18 及 iOS 26 beta。

## 原因
不指定 `utterance.voice` 时，Safari 使用系统默认语音，该默认值在 bug 中被绑到了粤语。

## Web Speech API 手动修复方法
1. iPhone 设置 → 辅助功能 → 朗读内容 → 声音 → 中文
2. 重新选择普通话语音
3. 修复后 3 号 voice（zh-CN）可正常朗读普通话
4. 代码中需**显式指定 `utterance.voice`** 为 3 号 voice，不能依赖默认

## 当前方案
已改用后端 `edge-tts`（zh-CN-XiaoxiaoNeural）生成普通话音频，不依赖浏览器 TTS，兼容所有平台。
