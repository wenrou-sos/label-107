/**
 * 系统设置状态管理 Store
 * - 数据刷新间隔
 * - 告警音效开关
 * - 主题色预设
 * - CSV 时间格式
 * 每项改动即时生效并持久化到 localStorage
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { RefreshInterval, ThemeColor, CsvTimeFormat } from '@/types'

const STORAGE_KEY = 'app-settings'

interface SettingsState {
  refreshInterval: RefreshInterval
  alertSoundEnabled: boolean
  themeColor: ThemeColor
  csvTimeFormat: CsvTimeFormat
}

const DEFAULT_SETTINGS: SettingsState = {
  refreshInterval: 5000,
  alertSoundEnabled: false,
  themeColor: 'blue',
  csvTimeFormat: '24h',
}

/** 主题色预设配置（accent 主色及配套色） */
export interface ThemeColorConfig {
  label: string
  accent: string
  accentSoft: string
  glow: string
  chartLine: string
}

export const THEME_COLOR_CONFIG: Record<ThemeColor, ThemeColorConfig> = {
  blue: {
    label: '经典蓝',
    accent: '#4f8dff',
    accentSoft: 'rgba(79, 141, 255, 0.14)',
    glow: 'rgba(79, 141, 255, 0.08)',
    chartLine: '#4F8DFF',
  },
  green: {
    label: '清新绿',
    accent: '#22c55e',
    accentSoft: 'rgba(34, 197, 94, 0.14)',
    glow: 'rgba(34, 197, 94, 0.08)',
    chartLine: '#22C55E',
  },
  purple: {
    label: '典雅紫',
    accent: '#a855f7',
    accentSoft: 'rgba(168, 85, 247, 0.14)',
    glow: 'rgba(168, 85, 247, 0.08)',
    chartLine: '#A855F7',
  },
}

/** 从 localStorage 读取设置 */
const loadSettings = (): SettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadSettings()

  const refreshInterval = ref<RefreshInterval>(initial.refreshInterval)
  const alertSoundEnabled = ref<boolean>(initial.alertSoundEnabled)
  const themeColor = ref<ThemeColor>(initial.themeColor)
  const csvTimeFormat = ref<CsvTimeFormat>(initial.csvTimeFormat)

  /** 设置面板是否打开 */
  const drawerVisible = ref(false)

  const openDrawer = () => {
    drawerVisible.value = true
  }
  const closeDrawer = () => {
    drawerVisible.value = false
  }

  /** 持久化全部设置 */
  const persist = () => {
    const state: SettingsState = {
      refreshInterval: refreshInterval.value,
      alertSoundEnabled: alertSoundEnabled.value,
      themeColor: themeColor.value,
      csvTimeFormat: csvTimeFormat.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  const setRefreshInterval = (v: RefreshInterval) => {
    refreshInterval.value = v
  }
  const setAlertSoundEnabled = (v: boolean) => {
    alertSoundEnabled.value = v
  }
  const setThemeColor = (v: ThemeColor) => {
    themeColor.value = v
  }
  const setCsvTimeFormat = (v: CsvTimeFormat) => {
    csvTimeFormat.value = v
  }

  /** 重置为默认设置 */
  const resetToDefault = () => {
    refreshInterval.value = DEFAULT_SETTINGS.refreshInterval
    alertSoundEnabled.value = DEFAULT_SETTINGS.alertSoundEnabled
    themeColor.value = DEFAULT_SETTINGS.themeColor
    csvTimeFormat.value = DEFAULT_SETTINGS.csvTimeFormat
  }

  // 任一设置变更即持久化
  watch(
    [refreshInterval, alertSoundEnabled, themeColor, csvTimeFormat],
    () => persist(),
    { deep: true }
  )

  return {
    refreshInterval,
    alertSoundEnabled,
    themeColor,
    csvTimeFormat,
    drawerVisible,
    openDrawer,
    closeDrawer,
    setRefreshInterval,
    setAlertSoundEnabled,
    setThemeColor,
    setCsvTimeFormat,
    resetToDefault,
    persist,
  }
})
