<script setup lang="ts">
/**
 * 系统设置抽屉面板
 * - 数据刷新间隔（3秒/5秒/10秒）
 * - 告警音效开关
 * - 主题色切换（蓝/绿/紫）
 * - CSV 时间格式（24小时/12小时）
 * 每项改动即时生效并存 localStorage
 */
import { computed } from 'vue'
import {
  Settings as SettingsIcon,
  RefreshCw,
  Volume2,
  Palette,
  Clock,
  X,
  RotateCcw,
} from 'lucide-vue-next'
import { useSettingsStore, THEME_COLOR_CONFIG } from '@/stores/settings'
import type { RefreshInterval, ThemeColor, CsvTimeFormat } from '@/types'

const settings = useSettingsStore()

const refreshIntervalOptions: { value: RefreshInterval; label: string }[] = [
  { value: 3000, label: '3 秒' },
  { value: 5000, label: '5 秒' },
  { value: 10000, label: '10 秒' },
]

const themeColorOptions: ThemeColor[] = ['blue', 'green', 'purple']

const csvTimeFormatOptions: { value: CsvTimeFormat; label: string; sample: string }[] = [
  { value: '24h', label: '24 小时制', sample: '14:30:00' },
  { value: '12h', label: '12 小时制', sample: '02:30:00 PM' },
]

/** 当前时间格式示例预览 */
const currentTimeSample = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  if (settings.csvTimeFormat === '12h') {
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`
  }
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
</script>

<template>
  <el-drawer
    v-model="settings.drawerVisible"
    title="系统设置"
    direction="rtl"
    size="380px"
    :with-header="false"
    class="settings-drawer"
  >
    <div class="flex flex-col h-full">
      <!-- 头部 -->
      <div
        class="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
        style="border-color: var(--border)"
      >
        <div class="flex items-center gap-2">
          <SettingsIcon :size="18" style="color: var(--accent)" />
          <h2 class="module-title">系统设置</h2>
        </div>
        <button
          class="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105"
          :style="{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }"
          title="关闭"
          @click="settings.closeDrawer()"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- 设置内容 -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <!-- 数据刷新间隔 -->
        <section class="rounded-xl p-4" style="background: var(--bg-elevated)">
          <div class="flex items-center gap-2 mb-3">
            <RefreshCw :size="15" style="color: var(--accent)" />
            <h3 class="text-sm font-semibold text-primary">数据刷新间隔</h3>
          </div>
          <p class="text-[11px] text-muted mb-3 leading-relaxed">
            控制分选线与包装区实时数据的更新频率，影响图表滚动节奏
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in refreshIntervalOptions"
              :key="opt.value"
              class="h-9 rounded-lg text-xs font-medium border transition-all"
              :style="
                settings.refreshInterval === opt.value
                  ? {
                      background: 'var(--accent-soft)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }
                  : {
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }
              "
              @click="settings.setRefreshInterval(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <!-- 告警音效 -->
        <section class="rounded-xl p-4" style="background: var(--bg-elevated)">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Volume2 :size="15" style="color: var(--warning)" />
              <h3 class="text-sm font-semibold text-primary">告警音效</h3>
            </div>
            <el-switch
              :model-value="settings.alertSoundEnabled"
              @update:model-value="settings.setAlertSoundEnabled"
            />
          </div>
          <p class="text-[11px] text-muted mt-3 leading-relaxed">
            开启后，新告警触发时播放提示音提醒值班人员
          </p>
        </section>

        <!-- 主题色 -->
        <section class="rounded-xl p-4" style="background: var(--bg-elevated)">
          <div class="flex items-center gap-2 mb-3">
            <Palette :size="15" style="color: var(--success)" />
            <h3 class="text-sm font-semibold text-primary">主题色</h3>
          </div>
          <p class="text-[11px] text-muted mb-3 leading-relaxed">
            切换界面强调色，图表与按钮将同步更新
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="color in themeColorOptions"
              :key="color"
              class="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all"
              :style="
                settings.themeColor === color
                  ? {
                      borderColor: THEME_COLOR_CONFIG[color].accent,
                      background: THEME_COLOR_CONFIG[color].accentSoft,
                    }
                  : {
                      borderColor: 'var(--border)',
                      background: 'var(--bg-card)',
                    }
              "
              @click="settings.setThemeColor(color)"
            >
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                :style="{
                  background: `linear-gradient(135deg, ${THEME_COLOR_CONFIG[color].accent}, ${THEME_COLOR_CONFIG[color].chartLine})`,
                }"
              >
                <span
                  v-if="settings.themeColor === color"
                  class="text-white text-xs font-bold"
                >
                  ✓
                </span>
              </span>
              <span class="text-[11px] font-medium text-secondary">
                {{ THEME_COLOR_CONFIG[color].label }}
              </span>
            </button>
          </div>
        </section>

        <!-- CSV 时间格式 -->
        <section class="rounded-xl p-4" style="background: var(--bg-elevated)">
          <div class="flex items-center gap-2 mb-3">
            <Clock :size="15" style="color: var(--gold)" />
            <h3 class="text-sm font-semibold text-primary">CSV 时间格式</h3>
          </div>
          <p class="text-[11px] text-muted mb-3 leading-relaxed">
            导出 CSV 时"导出时间"字段的时间显示格式
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in csvTimeFormatOptions"
              :key="opt.value"
              class="h-12 rounded-lg text-xs font-medium border transition-all flex flex-col items-center justify-center gap-0.5"
              :style="
                settings.csvTimeFormat === opt.value
                  ? {
                      background: 'var(--gold-soft)',
                      borderColor: 'var(--gold)',
                      color: 'var(--gold)',
                    }
                  : {
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)',
                    }
              "
              @click="settings.setCsvTimeFormat(opt.value)"
            >
              <span class="font-semibold">{{ opt.label }}</span>
              <span class="text-[10px] opacity-70">{{ opt.sample }}</span>
            </button>
          </div>
          <div class="mt-3 px-3 py-2 rounded-md flex items-center justify-between" style="background: var(--bg-card)">
            <span class="text-[10px] text-muted">当前预览</span>
            <span class="mono text-xs text-secondary">{{ currentTimeSample }}</span>
          </div>
        </section>

        <!-- 存储信息 -->
        <section class="rounded-xl p-4" style="background: var(--bg-elevated)">
          <p class="text-[11px] text-muted leading-relaxed">
            所有设置即时生效并自动保存到本地浏览器，刷新页面后仍然有效。
          </p>
        </section>
      </div>

      <!-- 底部操作 -->
      <div
        class="px-5 py-4 border-t flex-shrink-0 flex items-center justify-between gap-3"
        style="border-color: var(--border)"
      >
        <button
          class="text-xs text-muted hover:text-danger transition-colors flex items-center gap-1.5"
          @click="settings.resetToDefault()"
        >
          <RotateCcw :size="13" />
          恢复默认
        </button>
        <button
          class="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
          style="background: var(--accent); color: #fff"
          @click="settings.closeDrawer()"
        >
          完成
        </button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.settings-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: var(--bg-panel);
}
</style>
