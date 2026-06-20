<script setup lang="ts">
/**
 * 等级产出比例分析模块
 * - 环形图展示特级/一级/二级/次果占比
 * - 数字仪表盘显示各等级累计重量
 */
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useSortingStore } from '@/stores/sorting'
import { useChartTheme } from '@/composables/useECharts'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'
import { Download } from 'lucide-vue-next'
import { exportCsv } from '@/utils/exportCsv'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const store = useSortingStore()
const { isDark, palette } = useChartTheme()

const ringRef = ref<HTMLDivElement | null>(null)
let ringChart: echarts.ECharts | null = null

const centerTotal = useAnimatedNumber(() => store.totalWeight, 700)

const buildRingOption = () => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: palette.tooltipBg,
    borderColor: palette.tooltipBorder,
    textStyle: { color: palette.text, fontSize: 12 },
    formatter: (p: { name: string; value: number; percent: number }) =>
      `${p.name}<br/>重量 <b>${p.value}t</b><br/>占比 <b>${p.percent}%</b>`,
  },
  legend: { show: false },
  series: [
    {
      type: 'pie',
      radius: ['62%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#0f2238' : '#fff', borderWidth: 3 },
      label: {
        show: true,
        position: 'outside',
        color: palette.text,
        fontSize: 11,
        formatter: '{b}\n{d}%',
        lineHeight: 14,
      },
      labelLine: { length: 8, length2: 8, lineStyle: { color: palette.axisLine } },
      emphasis: { scale: true, scaleSize: 6, label: { fontSize: 13, fontWeight: 'bold' } },
      data: store.grades.map((g) => ({ name: g.label, value: g.weight, itemStyle: { color: g.color } })),
    },
  ],
})

const renderRing = () => ringChart?.setOption(buildRingOption(), true)

onMounted(() => {
  if (ringRef.value) {
    ringChart = echarts.init(ringRef.value)
    renderRing()
    window.addEventListener('resize', handleResize)
  }
  watch(
    () => store.grades,
    () => renderRing(),
    { deep: true }
  )
  watch(isDark, () => {
    if (ringRef.value) {
      ringChart?.dispose()
      ringChart = echarts.init(ringRef.value)
      renderRing()
    }
  })
})

const handleResize = () => ringChart?.resize()
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  ringChart?.dispose()
})

const w0 = useAnimatedNumber(() => store.grades[0]?.weight ?? 0, 700)
const w1 = useAnimatedNumber(() => store.grades[1]?.weight ?? 0, 700)
const w2 = useAnimatedNumber(() => store.grades[2]?.weight ?? 0, 700)
const w3 = useAnimatedNumber(() => store.grades[3]?.weight ?? 0, 700)
const animatedWeights = computed(() => [w0.value, w1.value, w2.value, w3.value])

/**
 * 导出等级分析数据 CSV
 * 内容：四个等级各自的重量和占比
 */
const handleExport = () => {
  const rows: unknown[][] = []
  rows.push(['等级产出比例分析报表'])
  rows.push(['导出时间', new Date().toLocaleString()])
  rows.push([])
  rows.push(['今日累计总量(吨)', store.totalWeight.toFixed(2)])
  rows.push([])
  rows.push(['等级名称', '重量(吨)', '占比(%)'])
  store.grades.forEach((g) => {
    const percent = store.totalWeight > 0 ? ((g.weight / store.totalWeight) * 100).toFixed(1) : '0.0'
    rows.push([g.label, g.weight.toFixed(2), percent])
  })
  exportCsv('等级分析数据', rows)
}
</script>

<template>
  <div class="panel-card p-5 h-full flex flex-col">
    <div class="flex items-center justify-between mb-2">
      <h3 class="module-title">等级产出比例分析</h3>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">实时更新</span>
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

    <div class="flex items-center gap-3 flex-1 min-h-0">
      <!-- 环形图 -->
      <div class="relative w-[46%] h-full min-h-[180px]">
        <div ref="ringRef" class="w-full h-full" />
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="top: -8px">
          <span class="text-[10px] text-muted tracking-wider">累计总量</span>
          <span class="mono text-2xl font-bold text-primary mt-0.5">
            {{ centerTotal.toFixed(1) }}
          </span>
          <span class="text-xs text-muted">吨</span>
        </div>
      </div>

      <!-- 数字仪表盘 -->
      <div class="flex-1 grid grid-cols-2 gap-2.5">
        <div
          v-for="(g, i) in store.grades"
          :key="g.grade"
          class="rounded-xl p-3 flex flex-col justify-between transition-all hover:translate-y-[-2px]"
          :style="{ background: g.color + '12', border: `1px solid ${g.color}22` }"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-secondary">{{ g.label }}</span>
            <span class="w-2 h-2 rounded-full" :style="{ background: g.color }" />
          </div>
          <div class="mt-1">
            <span class="mono text-2xl font-bold leading-none" :style="{ color: g.color }">
              {{ animatedWeights[i].toFixed(2) }}
            </span>
            <span class="text-[10px] text-muted ml-1">t</span>
          </div>
          <div class="mt-1.5 flex items-center gap-1.5">
            <div class="flex-1 h-1 rounded-full overflow-hidden" style="background: var(--border)">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{ width: `${g.ratio}%`, background: g.color }"
              />
            </div>
            <span class="mono text-[11px] font-semibold" :style="{ color: g.color }">
              {{ g.ratio }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
