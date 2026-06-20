<script setup lang="ts">
/**
 * 顶部状态栏 - 车间标题、班次、时钟、主题切换、告警计数
 */
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Sun, Moon, Bell, Activity, Factory, Clock3 } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useAlertStore } from '@/stores/alert'
import { usePackagingStore } from '@/stores/packaging'

const { isDark, toggleTheme } = useTheme()
const alertStore = useAlertStore()
const packagingStore = usePackagingStore()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const timeStr = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour12: false })
)
const dateStr = computed(() =>
  now.value.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
)

/** 当前班次 */
const shift = computed(() => {
  const h = now.value.getHours()
  if (h >= 8 && h < 16) return { name: '早班', color: 'var(--success)' }
  if (h >= 16 && h < 24) return { name: '中班', color: 'var(--warning)' }
  return { name: '夜班', color: 'var(--accent)' }
})
</script>

<template>
  <header
    class="flex items-center justify-between px-6 h-16 border-b relative z-10"
    style="background: var(--bg-panel); border-color: var(--border)"
  >
    <!-- 左侧：品牌标识 -->
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center"
        style="background: linear-gradient(135deg, var(--accent), var(--success))"
      >
        <Factory :size="22" color="#fff" />
      </div>
      <div>
        <h1 class="font-display font-bold text-lg leading-none text-primary">
          水果分选包装车间
        </h1>
        <p class="text-xs text-muted mt-1 tracking-wider">
          FRUIT SORTING & PACKING CONTROL CENTER
        </p>
      </div>
    </div>

    <!-- 中间：班次与时间 -->
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2 px-4 py-1.5 rounded-lg" style="background: var(--accent-soft)">
        <span class="status-dot" :style="{ background: shift.color, color: shift.color }" />
        <span class="font-display font-semibold text-sm text-primary">{{ shift.name }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock3 :size="16" class="text-muted" />
        <span class="mono text-sm text-secondary">{{ dateStr }}</span>
        <span class="mono text-lg font-bold text-primary tabular-nums">{{ timeStr }}</span>
      </div>
    </div>

    <!-- 右侧：指标与操作 -->
    <div class="flex items-center gap-5">
      <div class="flex items-center gap-2">
        <Activity :size="16" style="color: var(--success)" />
        <span class="text-xs text-muted">在线工人</span>
        <span class="mono font-bold text-primary">{{ packagingStore.state.workers }}</span>
      </div>
      <div class="flex items-center gap-2 cursor-pointer relative">
        <Bell :size="18" class="text-secondary" />
        <span
          v-if="alertStore.pendingCount > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
          style="background: var(--danger)"
        >
          {{ alertStore.pendingCount }}
        </span>
      </div>
      <button
        class="w-9 h-9 rounded-lg flex items-center justify-center border transition-all hover:scale-105"
        style="border-color: var(--border); background: var(--bg-card)"
        :title="isDark ? '切换至浅色模式' : '切换至深色模式'"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" :size="18" style="color: var(--gold)" />
        <Moon v-else :size="18" style="color: var(--accent)" />
      </button>
    </div>
  </header>
</template>
