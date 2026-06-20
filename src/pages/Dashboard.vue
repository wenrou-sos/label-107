<script setup lang="ts">
/**
 * 监控总览页 - 三栏式车间指挥大屏
 * 左侧导航 | 中间主监控区 | 右侧告警信息区
 */
import { onMounted, onBeforeUnmount, watch } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SideNav from '@/components/layout/SideNav.vue'
import AlertPanel from '@/components/layout/AlertPanel.vue'
import SettingsDrawer from '@/components/layout/SettingsDrawer.vue'
import SortingMonitor from '@/components/sorting/SortingMonitor.vue'
import GradeAnalysis from '@/components/grade/GradeAnalysis.vue'
import PackagingMonitor from '@/components/packaging/PackagingMonitor.vue'
import EfficiencyAnalysis from '@/components/efficiency/EfficiencyAnalysis.vue'
import FaultDialog from '@/components/alert/FaultDialog.vue'
import { useSortingStore } from '@/stores/sorting'
import { usePackagingStore } from '@/stores/packaging'
import { useAlertStore } from '@/stores/alert'
import { useLogStore } from '@/stores/log'
import { useSettingsStore } from '@/stores/settings'
import { genFaultEvent } from '@/utils/mock'

const sortingStore = useSortingStore()
const packagingStore = usePackagingStore()
const alertStore = useAlertStore()
const logStore = useLogStore()
const settings = useSettingsStore()

let sortingTimer: ReturnType<typeof setInterval> | null = null
let packagingTimer: ReturnType<typeof setInterval> | null = null
let faultTimer: ReturnType<typeof setTimeout>

/** 分选线单次 tick */
const sortingTick = () => {
  sortingStore.tick()
  // 小概率触发故障（约每 30-50 秒一次）
  if (Math.random() < 0.25 && sortingStore.status !== 'fault') {
    alertStore.triggerFault()
    // 触发故障时联动分选线状态为"故障"
    sortingStore.setStatus('fault')
  }
}

/** 包装 tick（按固定 3 秒推进，体现不同节奏） */
const packagingTick = () => {
  packagingStore.tick()
}

/** 启动分选线定时器（按当前刷新间隔） */
const startSortingTimer = () => {
  if (sortingTimer) clearInterval(sortingTimer)
  sortingTimer = setInterval(sortingTick, settings.refreshInterval)
}

/** 启动包装定时器（跟随刷新间隔设置） */
const startPackagingTimer = () => {
  if (packagingTimer) clearInterval(packagingTimer)
  packagingTimer = setInterval(packagingTick, settings.refreshInterval)
}

/** 启动数据模拟服务 */
const startSimulation = () => {
  startSortingTimer()
  startPackagingTimer()
}

/** 刷新间隔变更时同时重建分选线和包装区定时器 */
watch(
  () => settings.refreshInterval,
  () => {
    startSortingTimer()
    startPackagingTimer()
  }
)

/** 当所有未处理告警都被解决时，恢复分选线为"运行中" */
watch(
  () => alertStore.unresolvedCount,
  (count) => {
    if (count === 0 && sortingStore.status === 'fault') {
      sortingStore.setStatus('running')
    }
  }
)

const initMockLogs = () => {
  logStore.logSystemStart()

  const pastAlert1 = genFaultEvent()
  pastAlert1.createdAt = new Date(Date.now() - 1000 * 60 * 8).toLocaleString('zh-CN', { hour12: false })
  logStore.logAlertTriggered(pastAlert1)
  logStore.logAlertPushed(pastAlert1, '维修组 A')
  logStore.logAlertReceived(pastAlert1, '张师傅')
  logStore.logAlertResolved(pastAlert1, '张师傅')

  const pastAlert2 = genFaultEvent()
  pastAlert2.createdAt = new Date(Date.now() - 1000 * 60 * 5).toLocaleString('zh-CN', { hour12: false })
  logStore.logAlertTriggered(pastAlert2)
  logStore.logAlertPushed(pastAlert2, '维修组 B')
  logStore.logAlertReceived(pastAlert2, '李工')

  logStore.logStatusChange('stopped', 'running')
}

onMounted(() => {
  initMockLogs()
  startSimulation()
})
onBeforeUnmount(() => {
  if (sortingTimer) clearInterval(sortingTimer)
  if (packagingTimer) clearInterval(packagingTimer)
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
      <div id="section-alert">
        <AlertPanel />
      </div>
    </div>

    <!-- 故障告警弹窗 -->
    <FaultDialog />

    <!-- 系统设置抽屉 -->
    <SettingsDrawer />
  </div>
</template>
