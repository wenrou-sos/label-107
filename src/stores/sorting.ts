/**
 * 分选线状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SortingState, GradeItem, SpeedPoint } from '@/types'
import {
  genSortingState,
  nextSortingState,
  genGradeDistribution,
  genSpeedHistory,
} from '@/utils/mock'
import { useLogStore } from './log'

export const useSortingStore = defineStore('sorting', () => {
  const state = ref<SortingState>(genSortingState())
  const grades = ref<GradeItem[]>(genGradeDistribution(state.value.todayTotal))
  const speedHistory = ref<SpeedPoint[]>(genSpeedHistory())

  const totalWeight = computed(() => state.value.todayTotal)
  const speed = computed(() => state.value.sortingSpeed)
  const status = computed(() => state.value.status)

  const logStore = useLogStore()

  /** 每 5 秒推进实时数据 */
  const tick = () => {
    state.value = nextSortingState(state.value)
    grades.value = genGradeDistribution(state.value.todayTotal)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    speedHistory.value.push({
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      value: state.value.sortingSpeed,
    })
    if (speedHistory.value.length > 12) speedHistory.value.shift()
  }

  /** 设置运行状态 */
  const setStatus = (s: SortingState['status']) => {
    const previousStatus = state.value.status
    if (previousStatus !== s) {
      state.value.status = s
      logStore.logStatusChange(previousStatus, s)
    }
  }

  return { state, grades, speedHistory, totalWeight, speed, status, tick, setStatus }
})
