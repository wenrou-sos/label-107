<script setup lang="ts">
/**
 * 左侧导航 - 模块快速定位
 */
import { ref } from 'vue'
import {
  Gauge,
  PieChart,
  Package,
  AlertTriangle,
  TrendingUp,
  Settings,
} from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

interface NavItem {
  id: string
  label: string
  icon: typeof Gauge
  color: string
}

const items: NavItem[] = [
  { id: 'sorting', label: '分选监控', icon: Gauge, color: 'var(--accent)' },
  { id: 'grade', label: '等级分析', icon: PieChart, color: 'var(--gold)' },
  { id: 'packaging', label: '包装区', icon: Package, color: 'var(--success)' },
  { id: 'alert', label: '告警中心', icon: AlertTriangle, color: 'var(--danger)' },
  { id: 'efficiency', label: '效率分析', icon: TrendingUp, color: 'var(--warning)' },
]

const active = ref('sorting')
const settings = useSettingsStore()

const scrollTo = (id: string) => {
  active.value = id
  const el = document.getElementById(`section-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 给目标元素添加闪烁高亮，2.4s 后移除
    el.classList.add('nav-highlight-flash')
    window.setTimeout(() => {
      el.classList.remove('nav-highlight-flash')
    }, 2600)
  }
}
</script>

<template>
  <nav
    class="w-20 flex flex-col items-center py-5 gap-1 border-r relative z-10"
    style="background: var(--bg-panel); border-color: var(--border)"
  >
    <div class="font-display font-bold text-xs text-muted mb-3 tracking-widest">
      导航
    </div>

    <button
      v-for="item in items"
      :key="item.id"
      class="group relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300"
      :style="{
        background: active === item.id ? 'var(--accent-soft)' : 'transparent',
      }"
      :title="item.label"
      @click="scrollTo(item.id)"
    >
      <span
        class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full transition-all duration-300"
        :style="{
          background: active === item.id ? item.color : 'transparent',
          opacity: active === item.id ? 1 : 0,
        }"
      />
      <component
        :is="item.icon"
        :size="20"
        :style="{ color: active === item.id ? item.color : 'var(--text-muted)' }"
        class="transition-colors duration-300 group-hover:scale-110"
      />
      <span
        class="text-[10px] font-medium transition-colors duration-300"
        :style="{ color: active === item.id ? 'var(--text-primary)' : 'var(--text-muted)' }"
      >
        {{ item.label }}
      </span>
    </button>

    <div class="flex-1" />

    <button
      class="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 group"
      style="background: var(--bg-card)"
      title="系统设置"
      @click="settings.openDrawer()"
    >
      <Settings
        :size="20"
        class="text-muted transition-colors duration-300 group-hover:text-accent group-hover:rotate-90"
      />
    </button>
  </nav>
</template>
