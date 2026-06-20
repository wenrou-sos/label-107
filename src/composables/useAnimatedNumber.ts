/**
 * 数字动画组合式函数 - 平滑过渡到目标值
 */
import { ref, watch, onMounted } from 'vue'

export function useAnimatedNumber(target: () => number, duration = 600) {
  const display = ref(0)
  let raf: number | null = null

  const animate = (from: number, to: number) => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      display.value = from + (to - from) * eased
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        display.value = to
      }
    }
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }

  watch(
    () => target(),
    (newVal, oldVal) => {
      animate(oldVal ?? 0, newVal)
    }
  )

  onMounted(() => {
    display.value = target()
  })

  return display
}
