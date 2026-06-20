<script setup lang="ts">
/**
 * 监控总览页 - 三栏式车间指挥大屏
 * 左侧导航 | 中间主监控区 | 右侧告警信息区
 */
import { onMounted, onBeforeUnmount } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SideNav from '@/components/layout/SideNav.vue'
import AlertPanel from '@/components/layout/AlertPanel.vue'
import SortingMonitor from '@/components/sorting/SortingMonitor.vue'
import GradeAnalysis from '@/components/grade/GradeAnalysis.vue'
import PackagingMonitor from '@/components/packaging/PackagingMonitor.vue'
import EfficiencyAnalysis from '@/components/efficiency/EfficiencyAnalysis.vue'
import FaultDialog from '@/components/alert/FaultDialog.vue'
import { useSortingStore } from '@/stores/sorting'
import { usePackagingStore } from '@/stores/packaging'
import { useAlertStore } from '@/stores/alert'

const sortingStore = useSortingStore()
const packagingStore = usePackagingStore()
const alertStore = useAlertStore()

let sortingTimer: ReturnType<typeof setInterval>
let packagingTimer: ReturnType<typeof setInterval>
let faultTimer: ReturnType<typeof setTimeout>

/** 启动数据模拟服务 */
const startSimulation = () => {
  // 分选线数据每 5 秒更新
  sortingTimer = setInterval(() => {
    sortingStore.tick()
    // 小概率触发故障（约每 30-50 秒一次）
    if (Math.random() < 0.25 && sortingStore.status !== 'fault') {
      alertStore.triggerFault()
    }
  }, 5000)

  // 包装件数每 3 秒推进
  packagingTimer = setInterval(() => {
    packagingStore.tick()
  }, 3000)
}

onMounted(() => {
  startSimulation()
})
onBeforeUnmount(() => {
  clearInterval(sortingTimer)
  clearInterval(packagingTimer)
  clearTimeout(faultTimer)
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background: var(--bg-base)">
    <AppHeader />

    <div class="flex-1 flex min-h-0">
      <!-- 左侧导航 -->
      <SideNav />

      <!-- 中间主监控区 -->
      <main class="flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-2 gap-4 h-full auto-rows-min">
          <!-- 分选线实时数据 -->
          <section id="section-sorting" class="animate-fade-up" style="animation-delay: 0.05s">
            <SortingMonitor />
          </section>

          <!-- 等级产出比例 -->
          <section id="section-grade" class="animate-fade-up" style="animation-delay: 0.1s">
            <GradeAnalysis />
          </section>

          <!-- 包装区监控 -->
          <section id="section-packaging" class="animate-fade-up" style="animation-delay: 0.15s">
            <PackagingMonitor />
          </section>

          <!-- 效率分析 -->
          <section id="section-efficiency" class="animate-fade-up" style="animation-delay: 0.2s">
            <EfficiencyAnalysis />
          </section>
        </div>
      </main>

      <!-- 右侧告警信息流 -->
      <AlertPanel />
    </div>

    <!-- 故障告警弹窗 -->
    <FaultDialog />
  </div>
</template>
