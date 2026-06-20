/**
 * 分选线状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SortingState, GradeItem, SpeedPoint, SpeedTimeRange } from '@/types'
import {
  genSortingState,
  nextSortingState,
  genGradeDistribution,
  genSpeedHistory,
  randFloat,
} from '@/utils/mock'
import { useLogStore } from './log'

/** 各时间范围对应的历史点数（每 5 秒一个点） */
export const TIME_RANGE_POINTS: Record<SpeedTimeRange, number> = {
  '1min': 12,
  '5min': 60,
  '15min': 180,
}

/** 最大存储历史点数 */
const MAX_POINTS = TIME_RANGE_POINTS['15min']

export const useSortingStore = defineStore('sorting', () => {
  const state = ref<SortingState>(genSortingState())
  const grades = ref<GradeItem[]>(genGradeDistribution(state.value.todayTotal))
  /** 完整的速度历史数据，最多保留 15 分钟（180 个点） */
  const fullSpeedHistory = ref<SpeedPoint[]>(genSpeedHistory(MAX_POINTS))
  /** 当前选择的时间范围 */
  const speedTimeRange = ref<SpeedTimeRange>('1min')
  /** 图表是否暂停更新 */
  const chartPaused = ref(false)
  /** 暂停时的快照数据 */
  const pausedSnapshot = ref<SpeedPoint[]>([])

  const totalWeight = computed(() => state.value.todayTotal)
  const speed = computed(() => state.value.sortingSpeed)
  const status = computed(() => state.value.status)

  const logStore = useLogStore()

  /**
   * 根据时间范围截取历史数据
   * 暂停时返回快照，否则返回实时数据
   */
  const speedHistory = computed(() => {
    if (chartPaused.value && pausedSnapshot.value.length > 0) {
      return pausedSnapshot.value
    }
    const count = TIME_RANGE_POINTS[speedTimeRange.value]
    return fullSpeedHistory.value.slice(-count)
  })

  /**
   * 生成指定点数的历史速度数据
   * 用于切换时间范围时补全历史
   */
  const genHistoricalPoints = (count: number, endTime: Date): SpeedPoint[] => {
    const arr: SpeedPoint[] = []
    for (let i = count - 1; i >= 0; i--) {
      const t = new Date(endTime.getTime() - i * 5000)
      const pad = (n: number) => String(n).padStart(2, '0')
      arr.push({
        time: `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`,
        value: randFloat(3.0, 5.8),
      })
    }
    return arr
  }

  /** 切换时间范围 */
  const setSpeedTimeRange = (range: SpeedTimeRange) => {
    if (speedTimeRange.value === range) return
    const nextCount = TIME_RANGE_POINTS[range]
    speedTimeRange.value = range

    // 如果需要更多点数，生成历史数据补全
    if (nextCount > fullSpeedHistory.value.length) {
      const missing = nextCount - fullSpeedHistory.value.length
      const now = new Date()
      const firstPointTime = new Date(now.getTime() - fullSpeedHistory.value.length * 5000)
      const historical = genHistoricalPoints(missing, firstPointTime)
      fullSpeedHistory.value = [...historical, ...fullSpeedHistory.value]
    }

    // 如果处于暂停状态，同步更新快照
    if (chartPaused.value) {
      pausedSnapshot.value = fullSpeedHistory.value.slice(-nextCount)
    }
  }

  /** 切换图表暂停状态 */
  const toggleChartPause = () => {
    chartPaused.value = !chartPaused.value
    if (chartPaused.value) {
      // 暂停时截取快照
      const count = TIME_RANGE_POINTS[speedTimeRange.value]
      pausedSnapshot.value = [...fullSpeedHistory.value.slice(-count)]
    } else {
      pausedSnapshot.value = []
    }
  }

  /** 每 5 秒推进实时数据 */
  const tick = () => {
    state.value = nextSortingState(state.value)
    grades.value = genGradeDistribution(state.value.todayTotal)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    // 不管暂停与否，完整历史都持续推进
    fullSpeedHistory.value.push({
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      value: state.value.sortingSpeed,
    })
    if (fullSpeedHistory.value.length > MAX_POINTS) {
      fullSpeedHistory.value.shift()
    }
  }

  /** 设置运行状态 */
  const setStatus = (s: SortingState['status']) => {
    const previousStatus = state.value.status
    if (previousStatus !== s) {
      state.value.status = s
      logStore.logStatusChange(previousStatus, s)
    }
  }

  return {
    state,
    grades,
    fullSpeedHistory,
    speedHistory,
    speedTimeRange,
    chartPaused,
    totalWeight,
    speed,
    status,
    tick,
    setStatus,
    setSpeedTimeRange,
    toggleChartPause,
  }
})
