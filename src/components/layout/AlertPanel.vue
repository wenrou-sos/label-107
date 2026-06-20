<script setup lang="ts">
/**
 * 右侧告警信息流 - 实时告警列表与处理状态
 * 新增功能：关键字搜索 + 类型筛选 + 紧急程度筛选 + 激活标签显示
 */
import { ref, computed } from 'vue'
import {
  Bell,
  CheckCheck,
  Radio,
  Trash2,
  MapPin,
  Clock,
  Search,
  X,
  Filter,
} from 'lucide-vue-next'
import { useAlertStore } from '@/stores/alert'
import { URGENCY_CONFIG } from '@/utils/mock'
import type { AlertEvent, FaultType, Urgency } from '@/types'

const alertStore = useAlertStore()

/* ================== 状态 ================== */
/** 搜索关键字 */
const searchKeyword = ref('')
/** 选中的告警类型 */
const typeFilters = ref<Set<FaultType>>(new Set())
/** 选中的紧急程度 */
const urgencyFilters = ref<Set<Urgency>>(new Set())

/* ================== 常量配置 ================== */
const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  pushed: { label: '已推送', color: 'var(--accent)', bg: 'var(--accent-soft)' },
  received: { label: '已接收', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  resolved: { label: '已完成', color: 'var(--success)', bg: 'var(--success-soft)' },
}

const faultIcons: Record<string, string> = {
  sensor: '🔌',
  weight: '⚖️',
  optical: '🔦',
}

/** 告警类型筛选选项 */
const typeFilterOptions: { value: FaultType; label: string; icon: string }[] = [
  { value: 'sensor', label: '传感器', icon: '🔌' },
  { value: 'weight', label: '重量', icon: '⚖️' },
  { value: 'optical', label: '光学', icon: '🔦' },
]

/** 紧急程度筛选选项 */
const urgencyFilterOptions: { value: Urgency; label: string }[] = [
  { value: 'high', label: '紧急' },
  { value: 'medium', label: '重要' },
  { value: 'low', label: '一般' },
]

/* ================== 计算属性：组合过滤 ================== */
/**
 * 过滤后的告警列表
 * 逻辑：关键字搜索 AND 类型筛选 AND 紧急程度筛选
 */
const filteredEvents = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return alertStore.events.filter((ev) => {
    // 1. 关键字搜索（匹配类型标签、详情、位置）
    if (kw) {
      const hit =
        ev.typeLabel.toLowerCase().includes(kw) ||
        ev.detail.toLowerCase().includes(kw) ||
        ev.location.toLowerCase().includes(kw)
      if (!hit) return false
    }
    // 2. 类型筛选
    if (typeFilters.value.size > 0 && !typeFilters.value.has(ev.type)) {
      return false
    }
    // 3. 紧急程度筛选
    if (urgencyFilters.value.size > 0 && !urgencyFilters.value.has(ev.urgency)) {
      return false
    }
    return true
  })
})

/** 是否有任何激活的筛选条件 */
const hasActiveFilters = computed(
  () =>
    searchKeyword.value.trim() !== '' ||
    typeFilters.value.size > 0 ||
    urgencyFilters.value.size > 0
)

/** 激活的筛选标签列表（用于显示可清除的标签） */
interface ActiveTag {
  id: string
  label: string
  color?: string
  clear: () => void
}
const activeTags = computed<ActiveTag[]>(() => {
  const tags: ActiveTag[] = []
  // 搜索关键字标签
  if (searchKeyword.value.trim()) {
    tags.push({
      id: 'search',
      label: `关键词：${searchKeyword.value.trim()}`,
      clear: () => (searchKeyword.value = ''),
    })
  }
  // 类型标签
  typeFilters.value.forEach((t) => {
    const opt = typeFilterOptions.find((o) => o.value === t)
    if (opt) {
      tags.push({
        id: `type-${t}`,
        label: `类型：${opt.label}`,
        clear: () => typeFilters.value.delete(t),
      })
    }
  })
  // 紧急程度标签
  urgencyFilters.value.forEach((u) => {
    const cfg = URGENCY_CONFIG[u]
    tags.push({
      id: `urgency-${u}`,
      label: `级别：${cfg.label}`,
      color: cfg.color,
      clear: () => urgencyFilters.value.delete(u),
    })
  })
  return tags
})

/* ================== 方法 ================== */
const handleConfirm = (ev: AlertEvent) => alertStore.confirmReceived(ev.id)
const handleResolve = (ev: AlertEvent) => alertStore.markResolved(ev.id)

/** 切换类型筛选 */
const toggleTypeFilter = (type: FaultType) => {
  if (typeFilters.value.has(type)) {
    typeFilters.value.delete(type)
  } else {
    typeFilters.value.add(type)
  }
}

/** 切换紧急程度筛选 */
const toggleUrgencyFilter = (urgency: Urgency) => {
  if (urgencyFilters.value.has(urgency)) {
    urgencyFilters.value.delete(urgency)
  } else {
    urgencyFilters.value.add(urgency)
  }
}

/** 清除所有筛选条件 */
const clearAllFilters = () => {
  searchKeyword.value = ''
  typeFilters.value.clear()
  urgencyFilters.value.clear()
}
</script>

<template>
  <aside
    class="w-80 flex flex-col border-l relative z-10"
    style="background: var(--bg-panel); border-color: var(--border)"
  >
    <!-- 头部 -->
    <div class="px-4 py-4 border-b flex-shrink-0" style="border-color: var(--border)">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Bell :size="18" style="color: var(--danger)" />
          <h2 class="module-title">告警中心</h2>
        </div>
        <button
          v-if="alertStore.events.length"
          class="text-muted hover:text-danger transition-colors"
          title="清空告警"
          @click="alertStore.clearAll()"
        >
          <Trash2 :size="15" />
        </button>
      </div>

      <!-- 统计 -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="rounded-lg p-2 text-center" style="background: var(--danger-soft)">
          <div class="mono text-xl font-bold" style="color: var(--danger)">
            {{ alertStore.pendingCount }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">待处理</div>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: var(--warning-soft)">
          <div class="mono text-xl font-bold" style="color: var(--warning)">
            {{ alertStore.receivedCount }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">已接收</div>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: var(--success-soft)">
          <div class="mono text-xl font-bold" style="color: var(--success)">
            {{ alertStore.resolvedCount }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">已完成</div>
        </div>
      </div>

      <!-- 搜索输入框 -->
      <div class="relative mb-2">
        <Search
          :size="14"
          class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style="color: var(--text-muted)"
        />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索告警类型、位置、详情..."
          class="w-full h-9 pl-9 pr-8 rounded-lg text-xs border outline-none transition-all focus:border-accent"
          :style="{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }"
        />
        <button
          v-if="searchKeyword"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style="background: var(--bg-card)"
          title="清除搜索"
          @click="searchKeyword = ''"
        >
          <X :size="11" class="text-muted" />
        </button>
      </div>

      <!-- 类型筛选按钮 -->
      <div class="flex items-center gap-1.5 mb-2">
        <Filter :size="12" class="text-muted flex-shrink-0" />
        <div class="flex gap-1.5 flex-1">
          <button
            v-for="opt in typeFilterOptions"
            :key="opt.value"
            class="flex-1 h-7 rounded-md text-[11px] font-medium border transition-all flex items-center justify-center gap-1"
            :style="
              typeFilters.has(opt.value)
                ? {
                    background: 'var(--accent-soft)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                  }
                : {
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }
            "
            @click="toggleTypeFilter(opt.value)"
          >
            <span>{{ opt.icon }}</span>
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- 紧急程度筛选按钮 -->
      <div class="flex items-center gap-1.5 mb-3">
        <div class="w-3 flex-shrink-0" />
        <div class="flex gap-1.5 flex-1">
          <button
            v-for="opt in urgencyFilterOptions"
            :key="opt.value"
            class="flex-1 h-7 rounded-md text-[11px] font-medium border transition-all"
            :style="
              urgencyFilters.has(opt.value)
                ? {
                    background: URGENCY_CONFIG[opt.value].bg,
                    borderColor: URGENCY_CONFIG[opt.value].color,
                    color: URGENCY_CONFIG[opt.value].color,
                  }
                : {
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }
            "
            @click="toggleUrgencyFilter(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 激活筛选标签 -->
      <div v-if="hasActiveFilters" class="flex items-center gap-1.5 flex-wrap">
        <span
          v-for="tag in activeTags"
          :key="tag.id"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all group"
          :style="{
            background: tag.color ? tag.color + '18' : 'var(--accent-soft)',
            color: tag.color || 'var(--accent)',
          }"
        >
          {{ tag.label }}
          <button
            class="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:bg-black/10"
            title="清除该筛选条件"
            @click.stop="tag.clear()"
          >
            <X :size="9" />
          </button>
        </span>
        <button
          class="text-[10px] text-muted hover:text-primary transition-colors underline underline-offset-2"
          @click="clearAllFilters"
        >
          全部清除
        </button>
      </div>

      <!-- 筛选结果计数 -->
      <div
        v-if="hasActiveFilters"
        class="mt-2 flex items-center justify-between text-[10px] text-muted"
      >
        <span>
          筛选后 <b class="text-primary">{{ filteredEvents.length }}</b> 条
        </span>
        <span>/ 共 {{ alertStore.events.length }} 条</span>
      </div>
    </div>

    <!-- 列表 -->
    <div class="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
      <!-- 空状态 1：所有告警都被过滤了 -->
      <div
        v-if="hasActiveFilters && filteredEvents.length === 0 && alertStore.events.length > 0"
        class="flex flex-col items-center justify-center h-full text-muted gap-2"
      >
        <Filter :size="36" :style="{ color: 'var(--accent)', opacity: 0.4 }" />
        <p class="text-sm">没有匹配的告警</p>
        <button
          class="text-xs underline underline-offset-2 hover:text-primary transition-colors"
          @click="clearAllFilters"
        >
          清除筛选条件
        </button>
      </div>

      <!-- 空状态 2：无告警 -->
      <div
        v-else-if="!alertStore.events.length"
        class="flex flex-col items-center justify-center h-full text-muted gap-2"
      >
        <CheckCheck :size="36" :style="{ color: 'var(--success)', opacity: 0.4 }" />
        <p class="text-sm">暂无告警，产线运行正常</p>
      </div>

      <!-- 告警列表 -->
      <div
        v-for="ev in filteredEvents"
        :key="ev.id"
        class="animate-alert-in rounded-xl p-3 border transition-all hover:translate-x-[-2px]"
        :style="{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          borderLeft: `3px solid ${URGENCY_CONFIG[ev.urgency].color}`,
        }"
      >
        <!-- 顶部：类型 + 紧急程度 -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ faultIcons[ev.type] }}</span>
            <span class="font-display font-semibold text-sm text-primary">
              {{ ev.typeLabel }}
            </span>
          </div>
          <span
            class="text-[10px] font-bold px-2 py-0.5 rounded-full"
            :style="{
              color: URGENCY_CONFIG[ev.urgency].color,
              background: URGENCY_CONFIG[ev.urgency].bg,
            }"
          >
            {{ URGENCY_CONFIG[ev.urgency].label }}
          </span>
        </div>

        <!-- 详情 -->
        <p class="text-xs text-secondary leading-relaxed mb-2">{{ ev.detail }}</p>

        <!-- 位置 + 时间 -->
        <div class="flex items-center gap-3 text-[11px] text-muted mb-2">
          <span class="flex items-center gap-1">
            <MapPin :size="11" />
            {{ ev.location }}
          </span>
          <span class="flex items-center gap-1">
            <Clock :size="11" />
            {{ ev.createdAt.slice(11) }}
          </span>
        </div>

        <!-- 状态与操作 -->
        <div class="flex items-center justify-between">
          <span
            class="text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1"
            :style="{
              color: statusMeta[ev.status].color,
              background: statusMeta[ev.status].bg,
            }"
          >
            <Radio v-if="ev.status === 'pending'" :size="10" class="animate-pulse" />
            {{ statusMeta[ev.status].label }}
          </span>

          <div v-if="ev.status !== 'resolved'" class="flex gap-1.5">
            <button
              v-if="ev.status === 'pending' || ev.status === 'pushed'"
              class="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all hover:scale-105"
              style="background: var(--warning-soft); color: var(--warning)"
              @click="handleConfirm(ev)"
            >
              确认接收
            </button>
            <button
              class="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all hover:scale-105"
              style="background: var(--success-soft); color: var(--success)"
              @click="handleResolve(ev)"
            >
              处理完成
            </button>
          </div>
          <span v-else-if="ev.receiver" class="text-[10px] text-muted">
            {{ ev.receiver }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
