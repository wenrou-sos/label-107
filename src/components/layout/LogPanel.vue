<script setup lang="ts">
/**
 * 运行日志面板 - 产线重要事件时间线
 * 使用 Element Plus Timeline 组件展示
 */
import { ref, computed } from 'vue'
import {
  History,
  Trash2,
  MapPin,
  Filter,
  X,
  Download,
  Activity,
  AlertTriangle,
  CheckCircle,
  ArrowRightCircle,
  Send,
  Power,
} from 'lucide-vue-next'
import { useLogStore } from '@/stores/log'
import { URGENCY_CONFIG } from '@/utils/mock'
import { exportCsv, formatExportTime, reformatTime } from '@/utils/exportCsv'
import type { LogEventType } from '@/types'

const logStore = useLogStore()

const typeFilters = ref<Set<LogEventType>>(new Set())

const typeFilterOptions: { value: LogEventType; label: string; icon: typeof Activity }[] = [
  { value: 'status_change', label: '状态变更', icon: Activity },
  { value: 'alert_triggered', label: '告警触发', icon: AlertTriangle },
  { value: 'alert_resolved', label: '告警解决', icon: CheckCircle },
  { value: 'alert_received', label: '告警接收', icon: ArrowRightCircle },
  { value: 'alert_pushed', label: '告警推送', icon: Send },
  { value: 'system_start', label: '系统启动', icon: Power },
]

const filteredLogs = computed(() => {
  if (typeFilters.value.size === 0) return logStore.sortedLogs
  return logStore.sortedLogs.filter((log) => typeFilters.value.has(log.type))
})

const hasActiveFilters = computed(() => typeFilters.value.size > 0)

const activeTags = computed(() => {
  const tags: { id: string; label: string; clear: () => void }[] = []
  typeFilters.value.forEach((t) => {
    const opt = typeFilterOptions.find((o) => o.value === t)
    if (opt) {
      tags.push({
        id: `type-${t}`,
        label: opt.label,
        clear: () => typeFilters.value.delete(t),
      })
    }
  })
  return tags
})

const toggleTypeFilter = (type: LogEventType) => {
  if (typeFilters.value.has(type)) {
    typeFilters.value.delete(type)
  } else {
    typeFilters.value.add(type)
  }
}

const clearAllFilters = () => {
  typeFilters.value.clear()
}

const getTypeIcon = (type: LogEventType) => {
  const opt = typeFilterOptions.find((o) => o.value === type)
  return opt?.icon || Activity
}

const handleExport = () => {
  const rows: unknown[][] = []
  rows.push(['运行日志事件报表'])
  rows.push(['导出时间', formatExportTime()])
  rows.push(['日志总数', logStore.logs.length])
  rows.push([])
  rows.push(['时间', '事件类型', '内容描述', '位置', '紧急程度'])
  logStore.sortedLogs.forEach((log) => {
    rows.push([
      reformatTime(log.timestamp),
      log.typeLabel,
      log.content,
      log.location || '-',
      log.urgency ? URGENCY_CONFIG[log.urgency]?.label || log.urgency : '-',
    ])
  })
  exportCsv('运行日志', rows)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="px-4 py-4 border-b flex-shrink-0" style="border-color: var(--border)">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <History :size="18" style="color: var(--accent)" />
          <h2 class="module-title">运行日志</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="logStore.logs.length"
            class="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105"
            :style="{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }"
            title="导出全部 CSV"
            @click="handleExport"
          >
            <Download :size="13" />
          </button>
          <button
            v-if="logStore.logs.length"
            class="text-muted hover:text-danger transition-colors"
            title="清空日志"
            @click="logStore.clearAll()"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>

      <!-- 统计 -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="rounded-lg p-2 text-center" style="background: var(--danger-soft)">
          <div class="mono text-xl font-bold" style="color: var(--danger)">
            {{ logStore.logs.filter((l) => l.type === 'alert_triggered').length }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">告警触发</div>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: var(--success-soft)">
          <div class="mono text-xl font-bold" style="color: var(--success)">
            {{ logStore.logs.filter((l) => l.type === 'alert_resolved').length }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">已解决</div>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: var(--accent-soft)">
          <div class="mono text-xl font-bold" style="color: var(--accent)">
            {{ logStore.logs.filter((l) => l.type === 'status_change').length }}
          </div>
          <div class="text-[10px] text-muted mt-0.5">状态变更</div>
        </div>
      </div>

      <!-- 类型筛选 -->
      <div class="flex items-center gap-1.5 mb-2">
        <Filter :size="12" class="text-muted flex-shrink-0" />
        <div class="flex gap-1.5 flex-wrap flex-1">
          <button
            v-for="opt in typeFilterOptions"
            :key="opt.value"
            class="h-7 px-2 rounded-md text-[10px] font-medium border transition-all flex items-center justify-center gap-1"
            :style="
              typeFilters.has(opt.value)
                ? {
                    background: logStore.getTypeColor(opt.value) + '20',
                    borderColor: logStore.getTypeColor(opt.value),
                    color: logStore.getTypeColor(opt.value),
                  }
                : {
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                  }
            "
            @click="toggleTypeFilter(opt.value)"
          >
            <component :is="opt.icon" :size="10" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- 激活筛选标签 -->
      <div v-if="hasActiveFilters" class="flex items-center gap-1.5 flex-wrap">
        <span
          v-for="tag in activeTags"
          :key="tag.id"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all group"
          style="background: var(--accent-soft); color: var(--accent)"
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
          筛选后 <b class="text-primary">{{ filteredLogs.length }}</b> 条
        </span>
        <span>/ 共 {{ logStore.logs.length }} 条</span>
      </div>
    </div>

    <!-- 时间线列表 -->
    <div class="flex-1 overflow-y-auto px-3 py-3">
      <!-- 空状态 -->
      <div
        v-if="!logStore.logs.length"
        class="flex flex-col items-center justify-center h-full text-muted gap-2"
      >
        <History :size="36" :style="{ color: 'var(--accent)', opacity: 0.4 }" />
        <p class="text-sm">暂无运行日志</p>
      </div>

      <!-- 过滤后空状态 -->
      <div
        v-else-if="hasActiveFilters && filteredLogs.length === 0"
        class="flex flex-col items-center justify-center h-full text-muted gap-2"
      >
        <Filter :size="36" :style="{ color: 'var(--accent)', opacity: 0.4 }" />
        <p class="text-sm">没有匹配的日志</p>
        <button
          class="text-xs underline underline-offset-2 hover:text-primary transition-colors"
          @click="clearAllFilters"
        >
          清除筛选条件
        </button>
      </div>

      <!-- Timeline 时间线 -->
      <el-timeline v-else>
        <el-timeline-item
          v-for="log in filteredLogs"
          :key="log.id"
          :timestamp="log.timestamp"
          placement="top"
          :color="logStore.getTypeColor(log.type)"
        >
          <div
            class="rounded-lg p-3 border transition-all hover:translate-x-[-2px] animate-alert-in"
            :style="{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              borderLeft: `3px solid ${logStore.getTypeColor(log.type)}`,
            }"
          >
            <!-- 顶部：类型标签 -->
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <component
                  :is="getTypeIcon(log.type)"
                  :size="14"
                  :style="{ color: logStore.getTypeColor(log.type) }"
                />
                <span
                  class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  :style="{
                    color: logStore.getTypeColor(log.type),
                    background: logStore.getTypeColor(log.type) + '20',
                  }"
                >
                  {{ log.typeLabel }}
                </span>
                <span
                  v-if="log.urgency"
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  :style="{
                    color: URGENCY_CONFIG[log.urgency].color,
                    background: URGENCY_CONFIG[log.urgency].bg,
                  }"
                >
                  {{ URGENCY_CONFIG[log.urgency].label }}
                </span>
              </div>
            </div>

            <!-- 内容 -->
            <p class="text-xs text-secondary leading-relaxed mb-2">{{ log.content }}</p>

            <!-- 位置 -->
            <div v-if="log.location" class="flex items-center gap-1 text-[10px] text-muted">
              <MapPin :size="10" />
              {{ log.location }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>
