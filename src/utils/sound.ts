/**
 * 告警音效工具 - 基于 Web Audio API 生成提示音（无需音频文件）
 */

let audioCtx: AudioContext | null = null

/** 获取 AudioContext 实例（惰性创建） */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  return audioCtx
}

/**
 * 播放一段简单的双音告警提示音
 * 频率从高到低，模拟"嘀-嘟"的告警声
 */
export function playAlertSound(): void {
  const ctx = getAudioContext()
  if (!ctx) return

  // 某些浏览器需要用户交互后才能恢复音频上下文
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }

  const now = ctx.currentTime

  // 第一声：880Hz（高音）
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(880, now)
  gain1.gain.setValueAtTime(0, now)
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.02)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.25)

  // 第二声：660Hz（低音），延迟 0.3 秒
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(660, now + 0.3)
  gain2.gain.setValueAtTime(0, now + 0.3)
  gain2.gain.linearRampToValueAtTime(0.3, now + 0.32)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(now + 0.3)
  osc2.stop(now + 0.6)
}
