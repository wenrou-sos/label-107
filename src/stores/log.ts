/**
 * 运行日志状态管理 Store
 * 记录产线重要事件时间线：状态变更、告警触发、告警解决等
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RunLogEntry, LogEventType, RunStatus, AlertEvent } from '@/types'
import { genId, nowStr } from '@/utils/mock'

const STATUS_LABELS: Record<RunStatus, string> = {
  running: '运行中',
  stopped: '已停止',
  fault: '故障',
}

const EVENT_TYPE_LABELS: Record<LogEventType, string> = {
  status_change: '状态变更',
  alert_triggered: '告警触发',
  alert_resolved: '告警解决',
  alert_received: '告警接收',
  alert_pushed: '告警推送',
  system_start: '系统启动',
}

const EVENT_TYPE_COLORS: Record<LogEventType, string> = {
  status_change: '#4F8DFF',
  alert_triggered: '#FF4D5E',
  alert_resolved: '#34D9A4',
  alert_received: '#FFA940',
  alert_pushed: '#9B59B6',
  system_start: '#1890FF',
}

export const useLogStore = defineStore('log', () => {
  const logs = ref<RunLogEntry[]>([])

  const sortedLogs = computed(() =>
    [...logs.value].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  )

  const addLog = (entry: Omit<RunLogEntry, 'id' | 'timestamp'>) => {
    const log: RunLogEntry = {
      id: genId(),
      timestamp: nowStr(),
      ...entry,
    }
    logs.value.unshift(log)
    if (logs.value.length > 100) logs.value.pop()
  }

  const logStatusChange = (previousStatus: RunStatus, newStatus: RunStatus, location = '分选线') => {
    addLog({
      type: 'status_change',
      typeLabel: EVENT_TYPE_LABELS.status_change,
      content: `${location}状态从「${STATUS_LABELS[previousStatus]}」变为「${STATUS_LABELS[newStatus]}」`,
      location,
      previousStatus,
      newStatus,
    })
  }

  const logAlertTriggered = (alert: AlertEvent) => {
    addLog({
      type: 'alert_triggered',
      typeLabel: EVENT_TYPE_LABELS.alert_triggered,
      content: `【${alert.typeLabel}】${alert.detail}`,
      location: alert.location,
      urgency: alert.urgency,
    })
  }

  const logAlertResolved = (alert: AlertEvent, receiver?: string) => {
    addLog({
      type: 'alert_resolved',
      typeLabel: EVENT_TYPE_LABELS.alert_resolved,
      content: `【${alert.typeLabel}】已由 ${receiver || '操作员'} 处理完成`,
      location: alert.location,
      urgency: alert.urgency,
    })
  }

  const logAlertReceived = (alert: AlertEvent, receiver?: string) => {
    addLog({
      type: 'alert_received',
      typeLabel: EVENT_TYPE_LABELS.alert_received,
      content: `【${alert.typeLabel}】已由 ${receiver || '维修组'} 确认接收`,
      location: alert.location,
      urgency: alert.urgency,
    })
  }

  const logAlertPushed = (alert: AlertEvent, receiver?: string) => {
    addLog({
      type: 'alert_pushed',
      typeLabel: EVENT_TYPE_LABELS.alert_pushed,
      content: `【${alert.typeLabel}】已推送至 ${receiver || '维修组'}`,
      location: alert.location,
      urgency: alert.urgency,
    })
  }

  const logSystemStart = () => {
    addLog({
      type: 'system_start',
      typeLabel: EVENT_TYPE_LABELS.system_start,
      content: '监控系统已启动，开始实时监测产线运行状态',
    })
  }

  const clearAll = () => {
    logs.value = []
  }

  const getTypeColor = (type: LogEventType) => EVENT_TYPE_COLORS[type]

  return {
    logs,
    sortedLogs,
    addLog,
    logStatusChange,
    logAlertTriggered,
    logAlertResolved,
    logAlertReceived,
    logAlertPushed,
    logSystemStart,
    clearAll,
    getTypeColor,
  }
})
