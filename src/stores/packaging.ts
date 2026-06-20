/**
 * 包装区状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PackagingState, PackageSpec } from '@/types'
import { genPackagingState, randInt, FRUIT_VARIETIES } from '@/utils/mock'

export const usePackagingStore = defineStore('packaging', () => {
  const state = ref<PackagingState>(genPackagingState())
  /** 上一次触发动画的阈值 */
  const lastAnimateThreshold = ref<number>(
    Math.floor(state.value.packedCount / 10) * 10
  )
  /** 是否触发件数动画 */
  const animateFlag = ref(0)

  /** 每 3 秒推进包装件数 */
  const tick = () => {
    const inc = randInt(1, 4)
    const prev = state.value.packedCount
    state.value.packedCount += inc
    const prevBucket = Math.floor(prev / 10)
    const currBucket = Math.floor(state.value.packedCount / 10)
    if (currBucket > prevBucket) {
      lastAnimateThreshold.value = currBucket * 10
      animateFlag.value++
    }
  }

  /** 切换品种 */
  const setVariety = (id: string) => {
    const v = FRUIT_VARIETIES.find((x) => x.id === id)
    if (v) state.value.variety = v
  }

  /** 切换规格 */
  const setSpec = (spec: PackageSpec) => {
    state.value.spec = spec
  }

  /** 调整工人数量 */
  const adjustWorkers = (delta: number) => {
    const next = Math.max(0, Math.min(20, state.value.workers + delta))
    state.value.workers = next
  }

  return {
    state,
    animateFlag,
    lastAnimateThreshold,
    tick,
    setVariety,
    setSpec,
    adjustWorkers,
  }
})
