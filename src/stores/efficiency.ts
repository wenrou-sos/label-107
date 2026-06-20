/**
 * 产线效率分析状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EfficiencyDimension, EfficiencyRecord } from '@/types'
import { genEfficiencyData } from '@/utils/mock'

export const useEfficiencyStore = defineStore('efficiency', () => {
  const dimension = ref<EfficiencyDimension>('hour')
  const records = ref<EfficiencyRecord[]>(genEfficiencyData('hour'))

  /** 总实际与计划 */
  const totalActual = computed(() =>
    records.value.reduce((s, r) => s + r.actual, 0)
  )
  const totalPlanned = computed(() =>
    records.value.reduce((s, r) => s + r.planned, 0)
  )
  /** 整体偏差百分比 */
  const totalDeviation = computed(() => {
    if (totalPlanned.value === 0) return 0
    return parseFloat(
      (((totalActual.value - totalPlanned.value) / totalPlanned.value) * 100).toFixed(1)
    )
  })

  /** 切换维度 */
  const setDimension = (d: EfficiencyDimension) => {
    dimension.value = d
    records.value = genEfficiencyData(d)
  }

  return {
    dimension,
    records,
    totalActual,
    totalPlanned,
    totalDeviation,
    setDimension,
  }
})
