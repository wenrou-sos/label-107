<script setup lang="ts">
/**
 * 分选线实时数据监控模块
 * - 今日处理总量（吨，2位小数）
 * - 分选速度（吨/小时，5秒更新）
 * - 运行状态指示灯
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { TrendingUp, Zap, Activity, Download } from 'lucide-vue-next'
import { useSortingStore } from '@/stores/sorting'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'
import { useChartTheme } from '@/composables/useECharts'
import { exportCsv, STATUS_LABELS } from '@/utils/exportCsv'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const store = useSortingStore()
const { isDark, palette } = useChartTheme()

const totalDisplay = useAnimatedNumber(() => store.totalWeight, 700)
const speedDisplay = useAnimatedNumber(() => store.speed, 700)

const statusMap = {
  running: { label: '运行中', color: 'var(--success)', cls: 'status-running' },
  stopped: { label: '停机', color: 'var(--text-muted)', cls: 'status-stopped' },
  fault: { label: '故障', color: 'var(--danger)', cls: 'status-fault' },
}
const statusInfo = computed(() => statusMap[store.status])

const totalStr = computed(() => totalDisplay.value.toFixed(2))
const speedStr = computed(() => speedDisplay.value.toFixed(1))

const popKey = ref(0)
watch(
  () => store.totalWeight,
  () => {
    popKey.value++
  }
)

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const buildOption = () => ({
  grid: { top: 6, right: 4, bottom: 4, left: 4 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: palette.tooltipBg,
    borderColor: palette.tooltipBorder,
    textStyle: { color: palette.text, fontSize: 11 },
    formatter: (p: { axisValue: string; data: number }[]) =>
      `${p[0].axisValue}<br/>速度 <b>${p[0].data}</b> t/h`,
  },
  xAxis: { type: 'category', show: false, data: store.speedHistory.map((s) => s.time) },
  yAxis: { type: 'value', show: false, min: 2, max: 6 },
  series: [
    {
      type: 'line',
      data: store.speedHistory.map((s) => s.value),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: isDark.value ? '#4F8DFF' : '#2F7BFF' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(79,141,255,0.35)' },
          { offset: 1, color: 'rgba(79,141,255,0.02)' },
        ]),
      },
    },
  ],
})

const renderChart = () => {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    renderChart()
    window.addEventListener('resize', handleResize)
  }
  watch(
    () => store.speedHistory,
    () => renderChart(),
    { deep: true }
  )
  watch(isDark, () => {
    if (chartRef.value) {
      chart?.dispose()
      chart = echarts.init(chartRef.value)
      renderChart()
    }
  })
})

const handleResize = () => chart?.resize()
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

/**
 * 导出分选线数据 CSV
 * 内容：
 * - 头部：当前处理总量、分选速度、运行状态
 * - 速度历史：时间戳、速度值
 */
const handleExport = () => {
  const rows: unknown[][] = []
  // 汇总信息
  rows.push(['分选线监控数据报表'])
  rows.push(['导出时间', new Date().toLocaleString()])
  rows.push([])
  rows.push(['今日处理总量(吨)', store.totalWeight.toFixed(2)])
  rows.push(['分选速度(吨/小时)', store.speed.toFixed(1)])
  rows.push(['运行状态', STATUS_LABELS[store.status] || store.status])
  rows.push([])
  // 速度历史记录
  rows.push(['=== 过去一分钟速度历史记录 ==='])
  rows.push(['序号', '时间戳', '分选速度(吨/小时)'])
  store.speedHistory.forEach((p, i) => {
    rows.push([i + 1, p.time, p.value.toFixed(2)])
  })
  exportCsv('分选线数据', rows)
}
</script>

<template>
  <div class="panel-card p-5 h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="module-title">分选线实时数据</h3>
      <div class="flex items-center gap-2">
        <span
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          :style="{ background: 'var(--accent-soft)', color: 'var(--accent)' }"
        >
          <Activity :size="12" />
          实时
        </span>
        <button
          class="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-105"
          :style="{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }"
          title="导出 CSV"
          @click="handleExport"
        >
          <Download :size="14" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 flex-1">
      <!-- 今日处理总量 -->
      <div
        class="rounded-xl p-4 flex flex-col justify-between"
        style="background: var(--bg-elevated)"
      >
        <div class="flex items-center gap-1.5">
          <TrendingUp :size="14" class="text-muted" />
          <span class="metric-label">今日处理总量</span>
        </div>
        <div :key="popKey" class="flex items-baseline gap-1 mt-2">
          <span class="animate-number-pop mono text-4xl font-bold text-primary leading-none">
            {{ totalStr }}
          </span>
          <span class="text-sm text-muted ml-1">吨</span>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: var(--border)">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: `${Math.min((store.totalWeight / 50) * 100, 100)}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--success))',
              }"
            />
          </div>
          <span class="text-[10px] text-muted">/ 50t 目标</span>
        </div>
      </div>

      <!-- 分选速度 -->
      <div
        class="rounded-xl p-4 flex flex-col justify-between"
        style="background: var(--bg-elevated)"
      >
        <div class="flex items-center gap-1.5">
          <Zap :size="14" style="color: var(--warning)" />
          <span class="metric-label">分选速度</span>
        </div>
        <div class="flex items-baseline gap-1 mt-2">
          <span class="mono text-4xl font-bold leading-none" style="color: var(--warning)">
            {{ speedStr }}
          </span>
          <span class="text-sm text-muted ml-1">t/h</span>
        </div>
        <div ref="chartRef" class="w-full h-9 mt-1" />
      </div>
    </div>

    <!-- 运行状态指示灯 -->
    <div
      class="mt-4 rounded-xl px-4 py-3 flex items-center justify-between"
      :style="{ background: statusInfo.color + '14' }"
    >
      <div class="flex items-center gap-3">
        <span class="status-dot" :class="statusInfo.cls" />
        <div>
          <div class="text-xs text-muted">当前运行状态</div>
          <div class="font-display font-bold text-lg" :style="{ color: statusInfo.color }">
            {{ statusInfo.label }}
          </div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-muted">设备编号</div>
        <div class="mono text-sm text-secondary">SORT-A-01</div>
      </div>
    </div>
  </div>
</template>
