import { ref, watchEffect, onMounted, computed, watch } from 'vue'
import type { ThemeColor } from '@/types'
import { useSettingsStore, THEME_COLOR_CONFIG } from '@/stores/settings'

type Theme = 'light' | 'dark'

/** 应用主题色到 CSS 变量（覆盖 accent 相关变量） */
const applyThemeColor = (color: ThemeColor, isDark: boolean) => {
  const cfg = THEME_COLOR_CONFIG[color]
  const root = document.documentElement
  root.style.setProperty('--accent', cfg.accent)
  root.style.setProperty('--accent-soft', cfg.accentSoft)
  // 图表线条色通过 data 属性传递，由各图表自行读取
  root.style.setProperty('--chart-line', cfg.chartLine)
  // 浅色模式下 accent 稍微调暗一些以提升对比度
  if (!isDark && color === 'blue') {
    root.style.setProperty('--accent', '#2f7bff')
    root.style.setProperty('--accent-soft', 'rgba(47, 123, 255, 0.1)')
  }
}

export function useTheme() {
  const theme = ref<Theme>('light')
  const settings = useSettingsStore()

  const getPreferredTheme = (): Theme => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  const applyTheme = (t: Theme) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('theme', t)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    theme.value = getPreferredTheme()
    applyTheme(theme.value)
    applyThemeColor(settings.themeColor, theme.value === 'dark')
  })

  watchEffect(() => {
    applyTheme(theme.value)
  })

  // 主题色变化时即时应用
  watch(
    () => settings.themeColor,
    (color) => {
      applyThemeColor(color, theme.value === 'dark')
    }
  )

  // 明暗模式变化时也重新应用主题色（处理浅色模式下的特殊调整）
  watch(theme, (t) => {
    applyThemeColor(settings.themeColor, t === 'dark')
  })

  return {
    theme,
    toggleTheme,
    isDark: computed(() => theme.value === 'dark'),
  }
}
