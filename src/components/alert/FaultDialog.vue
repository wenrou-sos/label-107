<script setup lang="ts">
/**
 * 故障告警弹窗 - 异常自动弹窗告警
 * - 故障类型、发生时间、位置信息、紧急程度标识
 * - 推送维修组、确认接收、处理完成状态反馈
 */
import { computed } from 'vue'
import {
  AlertTriangle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  CircleCheck,
  X,
} from 'lucide-vue-next'
import { useAlertStore } from '@/stores/alert'
import { URGENCY_CONFIG } from '@/utils/mock'

const alertStore = useAlertStore()

const dialogVisible = computed({
  get: () => !!alertStore.activeDialog,
  set: (v) => {
    if (!v) alertStore.closeDialog()
  },
})

const faultIcons: Record<string, string> = {
  sensor: '🔌',
  weight: '⚖️',
  optical: '🔦',
}

const handlePush = () => {
  if (alertStore.activeDialog) alertStore.pushToRepair(alertStore.activeDialog.id)
}

const handleConfirm = () => {
  if (alertStore.activeDialog) alertStore.confirmReceived(alertStore.activeDialog.id)
}

const handleResolve = () => {
  if (alertStore.activeDialog) alertStore.markResolved(alertStore.activeDialog.id)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    width="460px"
    :show-close="false"
    align-center
    :close-on-click-modal="false"
    class="fault-dialog"
  >
    <template #header>
      <div class="flex items-center justify-between pr-4 pl-1">
        <div class="flex items-center gap-2">
          <AlertTriangle :size="20" style="color: var(--danger)" class="animate-pulse" />
          <span class="font-display font-bold text-base text-primary">分选机异常告警</span>
        </div>
        <button class="text-muted hover:text-primary transition-colors" @click="dialogVisible = false">
          <X :size="18" />
        </button>
      </div>
    </template>

    <div v-if="alertStore.activeDialog" class="px-1">
      <!-- 紧急程度横幅 -->
      <div
        class="rounded-xl p-3 mb-3 flex items-center justify-between"
        :style="{
          background: URGENCY_CONFIG[alertStore.activeDialog.urgency].bg,
          border: `1px solid ${URGENCY_CONFIG[alertStore.activeDialog.urgency].color}33`,
        }"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">{{ faultIcons[alertStore.activeDialog.type] }}</span>
          <div>
            <div class="font-display font-bold text-base text-primary">
              {{ alertStore.activeDialog.typeLabel }}
            </div>
            <div class="text-xs text-secondary mt-0.5">
              {{ alertStore.activeDialog.detail }}
            </div>
          </div>
        </div>
        <span
          class="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
          :style="{
            color: URGENCY_CONFIG[alertStore.activeDialog.urgency].color,
            background: 'var(--bg-card)',
          }"
        >
          {{ URGENCY_CONFIG[alertStore.activeDialog.urgency].label }}
        </span>
      </div>

      <!-- 信息网格 -->
      <div class="grid grid-cols-2 gap-2.5 mb-3">
        <div class="rounded-lg p-2.5" style="background: var(--bg-elevated)">
          <div class="flex items-center gap-1.5 text-muted mb-1">
            <Clock :size="12" />
            <span class="text-[10px]">发生时间</span>
          </div>
          <div class="mono text-xs font-semibold text-primary">
            {{ alertStore.activeDialog.createdAt }}
          </div>
        </div>
        <div class="rounded-lg p-2.5" style="background: var(--bg-elevated)">
          <div class="flex items-center gap-1.5 text-muted mb-1">
            <MapPin :size="12" />
            <span class="text-[10px]">位置信息</span>
          </div>
          <div class="text-xs font-semibold text-primary">
            {{ alertStore.activeDialog.location }}
          </div>
        </div>
      </div>

      <!-- 推送目标 -->
      <div class="rounded-lg p-2.5 mb-3 border" style="border-color: var(--border)">
        <div class="text-[10px] text-muted mb-1">推送目标 · 维修组</div>
        <el-select
          v-model="alertStore.repairTeam"
          size="small"
          class="w-full"
        >
          <el-option label="维修组 A（当班）" value="维修组 A（当班）" />
          <el-option label="维修组 B（备班）" value="维修组 B（备班）" />
          <el-option label="电气专家组" value="电气专家组" />
        </el-select>
      </div>

      <!-- 状态时间线 -->
      <div class="flex items-center justify-between mb-4 px-1">
        <div class="flex items-center gap-1.5">
          <CheckCircle2
            :size="16"
            :style="{
              color: alertStore.activeDialog.status !== 'pending' ? 'var(--success)' : 'var(--text-muted)',
            }"
          />
          <span class="text-[11px]" :class="alertStore.activeDialog.status !== 'pending' ? 'text-primary' : 'text-muted'">
            已推送
          </span>
        </div>
        <div class="flex-1 h-px mx-2" style="background: var(--border)" />
        <div class="flex items-center gap-1.5">
          <CheckCircle2
            :size="16"
            :style="{
              color: alertStore.activeDialog.status === 'received' || alertStore.activeDialog.status === 'resolved' ? 'var(--success)' : 'var(--text-muted)',
            }"
          />
          <span class="text-[11px]" :class="alertStore.activeDialog.status !== 'pending' ? 'text-primary' : 'text-muted'">
            已接收
          </span>
        </div>
        <div class="flex-1 h-px mx-2" style="background: var(--border)" />
        <div class="flex items-center gap-1.5">
          <CircleCheck
            :size="16"
            :style="{
              color: alertStore.activeDialog.status === 'resolved' ? 'var(--success)' : 'var(--text-muted)',
            }"
          />
          <span class="text-[11px]" :class="alertStore.activeDialog.status === 'resolved' ? 'text-primary' : 'text-muted'">
            处理完成
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <el-button
          v-if="alertStore.activeDialog?.status === 'pending'"
          type="warning"
          class="flex-1"
          @click="handlePush"
        >
          <Send :size="14" class="mr-1" />
          推送维修组
        </el-button>
        <el-button
          v-if="alertStore.activeDialog?.status === 'pending'"
          type="primary"
          class="flex-1"
          @click="handleConfirm"
        >
          <CheckCircle2 :size="14" class="mr-1" />
          确认接收
        </el-button>
        <el-button
          v-if="alertStore.activeDialog?.status !== 'resolved'"
          type="success"
          class="flex-1"
          @click="handleResolve"
        >
          <CircleCheck :size="14" class="mr-1" />
          处理完成
        </el-button>
        <el-button v-else type="info" class="flex-1" @click="dialogVisible = false">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
:deep(.el-dialog__body) {
  padding: 16px 20px;
}
:deep(.el-dialog__footer) {
  padding: 0 20px 20px;
}
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}
</style>
