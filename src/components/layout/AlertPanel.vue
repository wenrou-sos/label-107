<script setup lang="ts">
/**
 * 右侧告警信息流 - 实时告警列表与处理状态
 */
import { Bell, CheckCheck, Radio, Trash2, MapPin, Clock } from 'lucide-vue-next'
import { useAlertStore } from '@/stores/alert'
import { URGENCY_CONFIG } from '@/utils/mock'
import type { AlertEvent } from '@/types'

const alertStore = useAlertStore()

const statusMeta = {
  pending: { label: '待处理', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  received: { label: '已接收', color: 'var(--warning)', bg: 'var(--warning-soft)' },
  resolved: { label: '已完成', color: 'var(--success)', bg: 'var(--success-soft)' },
}

const faultIcons: Record<string, string> = {
  sensor: '🔌',
  weight: '⚖️',
  optical: '🔦',
}

const handleConfirm = (ev: AlertEvent) => alertStore.confirmReceived(ev.id)
const handleResolve = (ev: AlertEvent) => alertStore.markResolved(ev.id)
</script>

<template>
  <aside
    class="w-80 flex flex-col border-l relative z-10"
    style="background: var(--bg-panel); border-color: var(--border)"
  >
    <!-- 头部 -->
    <div class="px-4 py-4 border-b" style="border-color: var(--border)">
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
      <div class="grid grid-cols-3 gap-2">
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
    </div>

    <!-- 列表 -->
    <div class="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
      <div
        v-if="!alertStore.events.length"
        class="flex flex-col items-center justify-center h-full text-muted gap-2"
      >
        <CheckCheck :size="36" :style="{ color: 'var(--success)', opacity: 0.4 }" />
        <p class="text-sm">暂无告警，产线运行正常</p>
      </div>

      <div
        v-for="ev in alertStore.events"
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
              v-if="ev.status === 'pending'"
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
