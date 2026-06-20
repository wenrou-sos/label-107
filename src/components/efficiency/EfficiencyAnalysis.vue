<script setup lang="ts">
/**
 * 当日产线效率分析模块
 * - 折线图对比实际产出与计划产出
 * - 偏差百分比（正绿负红）
 * - 按小时/班次切换
 */
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { TrendingUp, TrendingDown, Target, Download } from 'lucide-vue-next'
import { useEfficiencyStore } from '@/stores/efficiency'
import { useChartTheme } from '@/composables/useECharts'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'
import type { EfficiencyDimension } from '@/types'
import { exportCsv } from '@/utils/exportCsv'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, CanvasRenderer])

const store = useEfficiencyStore()
const { isDark, palette } = useChartTheme()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const totalActual = useAnimatedNumber(() => store.totalActual, 600)
const totalPlanned = useAnimatedNumber(() => store.totalPlanned, 600)

const deviation = computed(() => store.totalDeviation)
const isPositive = computed(() => deviation.value >= 0)

const dimensionTabs: { value: EfficiencyDimension; label: string }[] = [
  { value: 'hour', label: '按小时' },
  { value: 'shift', label: '按班次' },
]

const buildOption = () => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: palette.tooltipBg,
    borderColor: palette.tooltipBorder,
    textStyle: { color: palette.text, fontSize: 12 },
    formatter: (params: { marker: string; seriesName: string; value: number; axisValue: string }[]) => {
      const header = params[0]?.axisValue || ''
      const lines = params
        .map((p) => `${p.marker} ${p.seriesName}：${p.value} t`)
        .join('<br/>')
      const rec = store.records.find((r) => r.label === header)
      const dev = rec
        ? `<br/>偏差 <b style="color:${rec.deviation >= 0 ? 'var(--success)' : 'var(--danger)'}">${rec.deviation >= 0 ? '+' : ''}${rec.deviation}%</b>`
        : ''
      return `${header}<br/>${lines}${dev}`
    },
  },
  legend: {
    data: ['计划产出', '实际产出'],
    textStyle: { color: palette.text, fontSize: 11 },
    icon: 'roundRect',
    itemWidth: 14,
    itemHeight: 3,
    top: 0,
    right: 0,
  },
  grid: { top: 30, right: 16, bottom: 28, left: 40 },
  xAxis: {
    type: 'category',
    data: store.records.map((r) => r.label),
    axisLine: { lineStyle: { color: palette.axisLine } },
    axisTick: { show: false },
    axisLabel: { color: palette.text, fontSize: 10 },
  },
  yAxis: {
    type: 'value',
    name: '吨',
    nameTextStyle: { color: palette.text, fontSize: 10 },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: palette.text, fontSize: 10 },
    splitLine: { lineStyle: { color: palette.splitLine } },
  },
  series: [
    {
      name: '计划产出',
      type: 'line',
      data: store.records.map((r) => r.planned),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: isDark.value ? '#8DA2C0' : '#7A8AA3', type: 'dashed' },
      itemStyle: { color: isDark.value ? '#8DA2C0' : '#7A8AA3' },
    },
    {
      name: '实际产出',
      type: 'line',
      data: store.records.map((r) => r.actual),
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: '#4F8DFF' },
      itemStyle: { color: '#4F8DFF', borderColor: isDark.value ? '#0f2238' : '#fff', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(79,141,255,0.28)' },
          { offset: 1, color: 'rgba(79,141,255,0.02)' },
        ]),
      },
      markPoint: {
        symbol: 'pin',
        symbolSize: 40,
        data: [{ type: 'max', name: '峰值' }],
        itemStyle: { color: 'var(--success)' },
        label: { fontSize: 10, color: '#fff' },
      },
    },
  ],
})

const renderChart = () => chart?.setOption(buildOption(), true)

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    renderChart()
    window.addEventListener('resize', handleResize)
  }
  watch(
    () => store.records,
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
 * 导出效率分析数据 CSV
 * 内容：当前维度（小时/班次）下的所有记录（计划值、实际值、偏差率）
 */
const handleExport = () => {
  const dimLabel = store.dimension === 'hour' ? '按小时' : '按班次'
  const rows: unknown[][] = []
  rows.push(['当日产线效率分析报表'])
  rows.push(['导出时间', new Date().toLocaleString()])
  rows.push(['分析维度', dimLabel])
  rows.push([])
  rows.push(['整体汇总'])
  rows.push(['计划产出(吨)', store.totalPlanned.toFixed(1)])
  rows.push(['实际产出(吨)', store.totalActual.toFixed(1)])
  rows.push(['整体偏差率(%)', (store.totalDeviation >= 0 ? '+' : '') + store.totalDeviation])
  rows.push([])
  rows.push(['=== 详细记录（' + dimLabel + '）==='])
  rows.push(['时间/班次', '计划产出(吨)', '实际产出(吨)', '偏差率(%)'])
  store.records.forEach((r) => {
    const dev = (r.deviation >= 0 ? '+' : '') + r.deviation.toFixed(1)
    rows.push([r.label, r.planned.toFixed(1), r.actual.toFixed(1), dev + '%'])
  })
  exportCsv('效率分析数据', rows)
}
</script>

<template>
  <div class="panel-card p-5 h-full flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <h3 class="module-title">当日产线效率分析</h3>
      <div class="flex items-center gap-2">
        <!-- 维度切换 -->
        <div class="flex rounded-lg p-0.5" style="background: var(--bg-elevated)">
          <button
            v-for="tab in dimensionTabs"
            :key="tab.value"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all"
            :style="
              store.dimension === tab.value
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--text-muted)' }
            "
            @click="store.setDimension(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
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

    <!-- 指标概览 -->
    <div class="grid grid-cols-3 gap-2.5 mb-3">
      <div class="rounded-xl p-2.5" style="background: var(--bg-elevated)">
        <div class="flex items-center gap-1.5">
          <Target :size="12" class="text-muted" />
          <span class="metric-label">计划产出</span>
        </div>
        <div class="mt-1">
          <span class="mono text-xl font-bold text-secondary">
            {{ totalPlanned.toFixed(1) }}
          </span>
          <span class="text-[10px] text-muted ml-1">t</span>
        </div>
      </div>
      <div class="rounded-xl p-2.5" style="background: var(--bg-elevated)">
        <div class="flex items-center gap-1.5">
          <TrendingUp :size="12" style="color: var(--accent)" />
          <span class="metric-label">实际产出</span>
        </div>
        <div class="mt-1">
          <span class="mono text-xl font-bold" style="color: var(--accent)">
            {{ totalActual.toFixed(1) }}
          </span>
          <span class="text-[10px] text-muted ml-1">t</span>
        </div>
      </div>
      <div
        class="rounded-xl p-2.5"
        :style="{ background: isPositive ? 'var(--success-soft)' : 'var(--danger-soft)' }"
      >
        <div class="flex items-center gap-1.5">
          <TrendingUp v-if="isPositive" :size="12" style="color: var(--success)" />
          <TrendingDown v-else :size="12" style="color: var(--danger)" />
          <span class="metric-label">偏差百分比</span>
        </div>
        <div class="mt-1">
          <span
            class="mono text-xl font-bold"
            :style="{ color: isPositive ? 'var(--success)' : 'var(--danger)' }"
          >
            {{ isPositive ? '+' : '' }}{{ deviation }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 折线图 -->
    <div ref="chartRef" class="flex-1 min-h-[160px] w-full" />
  </div>
</template>
