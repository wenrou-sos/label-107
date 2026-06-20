/**
 * 告警筛选功能单元测试
 * 覆盖：关键字搜索、类型筛选、紧急程度筛选、组合过滤
 */
import { describe, it, expect } from 'vitest'
import {
  filterByKeyword,
  filterByType,
  filterByUrgency,
  filterAlerts,
} from './alertFilter'
import type { AlertEvent } from '@/types'

/** 构造测试用的告警数据 */
const mockEvents: AlertEvent[] = [
  {
    id: '1',
    type: 'sensor',
    typeLabel: '传感器失灵',
    location: '分选线 A - 工位 03',
    urgency: 'high',
    createdAt: '2026-06-20 10:00:00',
    status: 'pending',
    detail: '称重传感器信号异常，读数波动超出阈值',
  },
  {
    id: '2',
    type: 'weight',
    typeLabel: '重量偏差超限',
    location: '分选线 B - 称重区',
    urgency: 'medium',
    createdAt: '2026-06-20 10:01:00',
    status: 'pushed',
    detail: '实时重量与目标重量偏差超过 5%，需校准',
  },
  {
    id: '3',
    type: 'optical',
    typeLabel: '光电识别错误',
    location: '分选线 C - 色选区',
    urgency: 'low',
    createdAt: '2026-06-20 10:02:00',
    status: 'received',
    detail: '光电色选器识别置信度低于 85%',
  },
  {
    id: '4',
    type: 'sensor',
    typeLabel: '传感器失灵',
    location: '分选线 B - 工位 07',
    urgency: 'medium',
    createdAt: '2026-06-20 10:03:00',
    status: 'pending',
    detail: '光电传感器信号丢失，需重新校准',
  },
  {
    id: '5',
    type: 'weight',
    typeLabel: '重量偏差超限',
    location: '分选线 A - 称重区',
    urgency: 'high',
    createdAt: '2026-06-20 10:04:00',
    status: 'received',
    detail: '重量偏差超过 10%，属于严重超限',
  },
  {
    id: '6',
    type: 'optical',
    typeLabel: '光电识别错误',
    location: '分选线 A - 色选区',
    urgency: 'high',
    createdAt: '2026-06-20 10:05:00',
    status: 'resolved',
    detail: '色选器镜头积尘，识别率下降',
  },
]

/* ==================================================
   关键字搜索测试
   ================================================== */
describe('filterByKeyword - 关键字搜索', () => {
  it('空字符串或纯空格返回全部数据', () => {
    expect(filterByKeyword(mockEvents, '')).toHaveLength(6)
    expect(filterByKeyword(mockEvents, '   ')).toHaveLength(6)
  })

  it('匹配类型名称（typeLabel）', () => {
    const result = filterByKeyword(mockEvents, '传感器')
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === 'sensor')).toBe(true)
  })

  it('匹配详情（detail）', () => {
    const result = filterByKeyword(mockEvents, '校准')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.detail.includes('校准') || e.detail.includes('校准'))).toBe(true)
  })

  it('匹配位置（location）', () => {
    const result = filterByKeyword(mockEvents, '分选线 A')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.location.includes('分选线 A'))).toBe(true)
  })

  it('匹配紧急程度文字（urgency label）- 紧急', () => {
    const result = filterByKeyword(mockEvents, '紧急')
    expect(result).toHaveLength(3)
    expect(result.every((e) => e.urgency === 'high')).toBe(true)
  })

  it('匹配紧急程度文字（urgency label）- 重要', () => {
    const result = filterByKeyword(mockEvents, '重要')
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.urgency === 'medium')).toBe(true)
  })

  it('匹配紧急程度文字（urgency label）- 一般', () => {
    const result = filterByKeyword(mockEvents, '一般')
    expect(result).toHaveLength(1)
    expect(result[0].urgency).toBe('low')
  })

  it('不区分大小写', () => {
    const r1 = filterByKeyword(mockEvents, 'Sensor')
    const r2 = filterByKeyword(mockEvents, 'sensor')
    const r3 = filterByKeyword(mockEvents, 'SENSOR')
    expect(r1.length).toBe(r2.length)
    expect(r2.length).toBe(r3.length)
  })

  it('支持部分匹配（子字符串）', () => {
    // "重" 应该能匹配 "重量偏差超限" 和 "称重" 相关内容
    const result = filterByKeyword(mockEvents, '重')
    expect(result.length).toBeGreaterThan(0)
  })

  it('无匹配时返回空数组', () => {
    const result = filterByKeyword(mockEvents, '不存在的关键词12345')
    expect(result).toEqual([])
  })

  it('输入两端空格被忽略（trim）', () => {
    const r1 = filterByKeyword(mockEvents, '  紧急  ')
    const r2 = filterByKeyword(mockEvents, '紧急')
    expect(r1.length).toBe(r2.length)
  })

  it('能同时匹配到不同字段', () => {
    // "光" 可能匹配类型"光电识别"和详情中的某些词
    const result = filterByKeyword(mockEvents, '光')
    expect(result.length).toBeGreaterThanOrEqual(2) // 至少 2 条光电类
  })
})

/* ==================================================
   类型筛选测试
   ================================================== */
describe('filterByType - 类型筛选', () => {
  it('空集合返回全部数据', () => {
    expect(filterByType(mockEvents, new Set())).toHaveLength(6)
    expect(filterByType(mockEvents, [])).toHaveLength(6)
  })

  it('单选传感器类型', () => {
    const result = filterByType(mockEvents, new Set(['sensor']))
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === 'sensor')).toBe(true)
  })

  it('单选重量类型', () => {
    const result = filterByType(mockEvents, ['weight'])
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.type === 'weight')).toBe(true)
  })

  it('多选类型（OR 关系）', () => {
    const result = filterByType(mockEvents, new Set(['sensor', 'weight']))
    expect(result).toHaveLength(4)
    expect(result.every((e) => e.type === 'sensor' || e.type === 'weight')).toBe(true)
  })

  it('全选返回全部', () => {
    const result = filterByType(mockEvents, ['sensor', 'weight', 'optical'])
    expect(result).toHaveLength(6)
  })

  it('支持数组和 Set 两种入参', () => {
    const arrResult = filterByType(mockEvents, ['sensor'])
    const setResult = filterByType(mockEvents, new Set(['sensor']))
    expect(arrResult.length).toBe(setResult.length)
    expect(arrResult.map((e) => e.id).sort()).toEqual(setResult.map((e) => e.id).sort())
  })
})

/* ==================================================
   紧急程度筛选测试
   ================================================== */
describe('filterByUrgency - 紧急程度筛选', () => {
  it('空集合返回全部数据', () => {
    expect(filterByUrgency(mockEvents, new Set())).toHaveLength(6)
    expect(filterByUrgency(mockEvents, [])).toHaveLength(6)
  })

  it('单选紧急（high）', () => {
    const result = filterByUrgency(mockEvents, new Set(['high']))
    expect(result).toHaveLength(3)
    expect(result.every((e) => e.urgency === 'high')).toBe(true)
  })

  it('单选重要（medium）', () => {
    const result = filterByUrgency(mockEvents, ['medium'])
    expect(result).toHaveLength(2)
    expect(result.every((e) => e.urgency === 'medium')).toBe(true)
  })

  it('单选一般（low）', () => {
    const result = filterByUrgency(mockEvents, new Set(['low']))
    expect(result).toHaveLength(1)
    expect(result[0].urgency).toBe('low')
  })

  it('多选紧急程度（OR 关系）', () => {
    const result = filterByUrgency(mockEvents, ['high', 'medium'])
    expect(result).toHaveLength(5) // 3 high + 2 medium
    expect(result.every((e) => e.urgency === 'high' || e.urgency === 'medium')).toBe(true)
  })

  it('全选返回全部', () => {
    const result = filterByUrgency(mockEvents, ['high', 'medium', 'low'])
    expect(result).toHaveLength(6)
  })
})

/* ==================================================
   组合过滤测试
   ================================================== */
describe('filterAlerts - 组合过滤（AND 关系）', () => {
  it('无任何筛选条件返回全部', () => {
    expect(filterAlerts(mockEvents, {})).toHaveLength(6)
  })

  it('仅关键词筛选', () => {
    const result = filterAlerts(mockEvents, { keyword: '传感器' })
    expect(result).toHaveLength(2)
  })

  it('仅类型筛选', () => {
    const result = filterAlerts(mockEvents, { types: ['sensor'] })
    expect(result).toHaveLength(2)
  })

  it('仅紧急程度筛选', () => {
    const result = filterAlerts(mockEvents, { urgencies: ['high'] })
    expect(result).toHaveLength(3)
  })

  it('关键词 + 类型（AND）', () => {
    // 搜索"信号" + 类型 sensor → 应该匹配到 1 或 2 条
    const result = filterAlerts(mockEvents, {
      keyword: '信号',
      types: ['sensor'],
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.type === 'sensor')).toBe(true)
    expect(result.every((e) => (e.detail + e.typeLabel).includes('信号'))).toBe(true)
  })

  it('关键词 + 紧急程度（AND）', () => {
    // 搜索"紧急" + 紧急程度 high → 应该匹配到 high 的全部
    const result = filterAlerts(mockEvents, {
      keyword: '紧急',
      urgencies: ['high'],
    })
    expect(result).toHaveLength(3) // 所有 high 的
  })

  it('类型 + 紧急程度（AND）', () => {
    // sensor + high → 1 条
    const result = filterAlerts(mockEvents, {
      types: ['sensor'],
      urgencies: ['high'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('sensor')
    expect(result[0].urgency).toBe('high')
  })

  it('关键词 + 类型 + 紧急程度（三者 AND）', () => {
    // 搜索"传感器" + 类型 sensor + 紧急程度 high → 1 条
    const result = filterAlerts(mockEvents, {
      keyword: '传感器',
      types: ['sensor'],
      urgencies: ['high'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('组合筛选无匹配返回空数组', () => {
    const result = filterAlerts(mockEvents, {
      keyword: '不存在的词',
      types: ['sensor'],
      urgencies: ['high'],
    })
    expect(result).toEqual([])
  })

  it('空列表输入返回空列表', () => {
    expect(filterAlerts([], { keyword: '测试' })).toEqual([])
    expect(filterAlerts([], { types: ['sensor'] })).toEqual([])
    expect(filterAlerts([], { urgencies: ['high'] })).toEqual([])
    expect(filterAlerts([], {})).toEqual([])
  })
})

/* ==================================================
   边界与特殊场景
   ================================================== */
describe('边界与特殊场景', () => {
  it('空字符串关键词等于不设关键词筛选', () => {
    const r1 = filterAlerts(mockEvents, { keyword: '' })
    const r2 = filterAlerts(mockEvents, {})
    expect(r1.length).toBe(r2.length)
  })

  it('搜索单字也能匹配', () => {
    const result = filterByKeyword(mockEvents, 'A')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.location.includes('A') || e.detail.toLowerCase().includes('a'))).toBe(true)
  })

  it('关键词搜索同时匹配多个字段的同一条记录', () => {
    // 搜索"分选线 A 称重" 同时匹配位置和详情/类型
    const result = filterByKeyword(mockEvents, '分选线 A')
    expect(result.length).toBeGreaterThan(0)
  })

  it('搜索类型名称的部分字也能匹配', () => {
    // "传感" 能匹配 "传感器失灵"
    const result = filterByKeyword(mockEvents, '传感')
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.every((e) => e.typeLabel.includes('传感'))).toBe(true)
  })

  it('筛选结果保持原有顺序', () => {
    const result = filterByType(mockEvents, ['sensor', 'weight'])
    const originalIds = mockEvents.filter((e) => e.type === 'sensor' || e.type === 'weight').map((e) => e.id)
    const resultIds = result.map((e) => e.id)
    expect(resultIds).toEqual(originalIds)
  })
})
