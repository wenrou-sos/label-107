/**
 * 全局类型定义 - 水果分选包装车间监控面板
 */

/** 运行状态 */
export type RunStatus = 'running' | 'stopped' | 'fault'

/** 水果等级 */
export type Grade = 'premium' | 'first' | 'second' | 'sub'

/** 包装规格 */
export type PackageSpec = '5kg' | '10kg' | 'gift'

/** 故障类型 */
export type FaultType = 'sensor' | 'weight' | 'optical'

/** 紧急程度 */
export type Urgency = 'high' | 'medium' | 'low'

/** 告警流转状态：待处理 → 已推送 → 已接收 → 已完成 */
export type AlertStatus = 'pending' | 'pushed' | 'received' | 'resolved'

/** 效率分析维度 */
export type EfficiencyDimension = 'hour' | 'shift'

/** 分选线实时状态 */
export interface SortingState {
  todayTotal: number
  sortingSpeed: number
  status: RunStatus
}

/** 等级项 */
export interface GradeItem {
  grade: Grade
  label: string
  weight: number
  ratio: number
  color: string
}

/** 水果品种 */
export interface FruitVariety {
  id: string
  name: string
  image: string
  unit: string
}

/** 包装区状态 */
export interface PackagingState {
  variety: FruitVariety
  spec: PackageSpec
  packedCount: number
  workers: number
}

/** 包装规格选项 */
export interface SpecOption {
  value: PackageSpec
  label: string
  desc: string
}

/** 故障告警事件 */
export interface AlertEvent {
  id: string
  type: FaultType
  typeLabel: string
  location: string
  urgency: Urgency
  createdAt: string
  status: AlertStatus
  receiver?: string
  resolvedAt?: string
  detail: string
}

/** 效率记录 */
export interface EfficiencyRecord {
  label: string
  actual: number
  planned: number
  deviation: number
}

/** 速度历史点 */
export interface SpeedPoint {
  time: string
  value: number
}

/** 运行日志事件类型 */
export type LogEventType =
  | 'status_change'
  | 'alert_triggered'
  | 'alert_resolved'
  | 'alert_received'
  | 'alert_pushed'
  | 'system_start'

/** 运行日志条目 */
export interface RunLogEntry {
  id: string
  type: LogEventType
  typeLabel: string
  timestamp: string
  content: string
  location?: string
  urgency?: Urgency
  previousStatus?: RunStatus
  newStatus?: RunStatus
}
