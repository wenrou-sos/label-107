/**
 * 故障告警状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AlertEvent } from '@/types'
import { genFaultEvent } from '@/utils/mock'
import { useLogStore } from './log'
import { useSettingsStore } from './settings'
import { playAlertSound } from '@/utils/sound'

export const useAlertStore = defineStore('alert', () => {
  const events = ref<AlertEvent[]>([])
  /** 当前弹窗中的告警 */
  const activeDialog = ref<AlertEvent | null>(null)
  /** 推送目标维修组 */
  const repairTeam = ref('维修组 A（当班）')

  const logStore = useLogStore()
  const settings = useSettingsStore()

  const pendingCount = computed(
    () => events.value.filter((e) => e.status === 'pending').length
  )
  const pushedCount = computed(
    () => events.value.filter((e) => e.status === 'pushed').length
  )
  const receivedCount = computed(
    () => events.value.filter((e) => e.status === 'received').length
  )
  const resolvedCount = computed(
    () => events.value.filter((e) => e.status === 'resolved').length
  )
  /** 未完成的告警数量（用于判断是否将产线置为故障态） */
  const unresolvedCount = computed(
    () => events.value.filter((e) => e.status !== 'resolved').length
  )

  /** 触发一次故障 */
  const triggerFault = () => {
    const ev = genFaultEvent()
    events.value.unshift(ev)
    if (events.value.length > 50) events.value.pop()
    if (!activeDialog.value) activeDialog.value = ev
    logStore.logAlertTriggered(ev)
    // 告警音效（受设置开关控制）
    if (settings.alertSoundEnabled) {
      playAlertSound()
    }
  }

  /** 推送至维修组（仅标记"已推送"，需维修组另行"确认接收"） */
  const pushToRepair = (id: string) => {
    const ev = events.value.find((e) => e.id === id)
    if (ev && ev.status === 'pending') {
      ev.status = 'pushed'
      ev.receiver = repairTeam.value
      logStore.logAlertPushed(ev, ev.receiver)
    }
  }

  /** 确认接收（可从待处理或已推送状态推进到"已接收"） */
  const confirmReceived = (id: string) => {
    const ev = events.value.find((e) => e.id === id)
    if (ev && (ev.status === 'pending' || ev.status === 'pushed')) {
      ev.status = 'received'
      ev.receiver = ev.receiver || repairTeam.value
      logStore.logAlertReceived(ev, ev.receiver)
    }
  }

  /** 标记处理完成 */
  const markResolved = (id: string) => {
    const ev = events.value.find((e) => e.id === id)
    if (ev && ev.status !== 'resolved') {
      ev.status = 'resolved'
      ev.resolvedAt = new Date().toLocaleString('zh-CN', { hour12: false })
      logStore.logAlertResolved(ev, ev.receiver)
    }
    if (activeDialog.value?.id === id) activeDialog.value = null
  }

  /** 关闭弹窗（仅关闭界面，不改变状态） */
  const closeDialog = () => {
    activeDialog.value = null
  }

  /** 手动清除全部告警 */
  const clearAll = () => {
    events.value = []
    activeDialog.value = null
  }

  return {
    events,
    activeDialog,
    repairTeam,
    pendingCount,
    pushedCount,
    receivedCount,
    resolvedCount,
    unresolvedCount,
    triggerFault,
    pushToRepair,
    confirmReceived,
    markResolved,
    closeDialog,
    clearAll,
  }
})
