/**
 * 告警筛选工具函数 - 纯函数，便于单元测试
 */
import type { AlertEvent, FaultType, Urgency } from '@/types'
import { URGENCY_CONFIG } from './mock'

/**
 * 关键字搜索匹配
 * 匹配范围：类型名称(typeLabel)、详情(detail)、位置(location)、紧急程度文字(urgency label)
 * @param events 告警列表
 * @param keyword 搜索关键字（不区分大小写）
 */
export function filterByKeyword(events: AlertEvent[], keyword: string): AlertEvent[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return events

  return events.filter((ev) => {
    const urgencyLabel = URGENCY_CONFIG[ev.urgency]?.label || ''
    return (
      ev.typeLabel.toLowerCase().includes(kw) ||
      ev.detail.toLowerCase().includes(kw) ||
      ev.location.toLowerCase().includes(kw) ||
      urgencyLabel.toLowerCase().includes(kw)
    )
  })
}

/**
 * 按告警类型筛选（多选 OR 关系）
 * @param events 告警列表
 * @param types 选中的类型集合，空集合表示不过滤
 */
export function filterByType(
  events: AlertEvent[],
  types: Set<FaultType> | FaultType[]
): AlertEvent[] {
  const typeSet = Array.isArray(types) ? new Set(types) : types
  if (typeSet.size === 0) return events
  return events.filter((ev) => typeSet.has(ev.type))
}

/**
 * 按紧急程度筛选（多选 OR 关系）
 * @param events 告警列表
 * @param urgencies 选中的紧急程度集合，空集合表示不过滤
 */
export function filterByUrgency(
  events: AlertEvent[],
  urgencies: Set<Urgency> | Urgency[]
): AlertEvent[] {
  const urgencySet = Array.isArray(urgencies) ? new Set(urgencies) : urgencies
  if (urgencySet.size === 0) return events
  return events.filter((ev) => urgencySet.has(ev.urgency))
}

/**
 * 组合过滤（关键字 AND 类型 AND 紧急程度）
 * @param events 告警列表
 * @param options 过滤选项
 */
export interface FilterOptions {
  keyword?: string
  types?: Set<FaultType> | FaultType[]
  urgencies?: Set<Urgency> | Urgency[]
}

export function filterAlerts(events: AlertEvent[], options: FilterOptions): AlertEvent[] {
  let result = events
  if (options.keyword !== undefined) {
    result = filterByKeyword(result, options.keyword)
  }
  if (options.types !== undefined) {
    result = filterByType(result, options.types)
  }
  if (options.urgencies !== undefined) {
    result = filterByUrgency(result, options.urgencies)
  }
  return result
}
