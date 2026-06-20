/**
 * ECharts 组合式函数 - 封装图表初始化、自适应与主题响应
 */
import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import * as echarts from 'echarts/core'
import {
  PieChart,
  LineChart,
  GaugeChart,
  BarChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { useTheme } from '@/composables/useTheme'

echarts.use([
  PieChart,
  LineChart,
  GaugeChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer,
])

/** 主题相关的图表配色 */
export function useChartTheme() {
  const { isDark } = useTheme()
  const palette = {
    text: isDark.value ? '#8DA2C0' : '#5A6B85',
    axisLine: isDark.value ? 'rgba(141,162,192,0.18)' : 'rgba(90,107,133,0.18)',
    splitLine: isDark.value ? 'rgba(141,162,192,0.1)' : 'rgba(90,107,133,0.1)',
    tooltipBg: isDark.value ? '#0F2238' : '#FFFFFF',
    tooltipBorder: isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(11,31,58,0.08)',
  }
  return { isDark, palette }
}

/**
 * 使用 ECharts 实例
 * @param elRef 挂载容器的 ref
 * @param optionFn 返回 EChartsOption 的函数（响应主题变化）
 */
export function useECharts(
  elRef: Ref<HTMLElement | null>,
  optionFn: () => EChartsOption
) {
  const chart = ref<echarts.ECharts | null>(null)
  const { isDark } = useChartTheme()

  const render = () => {
    if (!chart.value) return
    chart.value.setOption(optionFn(), true)
  }

  const resize = () => {
    chart.value?.resize()
  }

  onMounted(() => {
    if (elRef.value) {
      chart.value = echarts.init(elRef.value)
      render()
      window.addEventListener('resize', resize)
    }
  })

  watch(isDark, () => {
    if (chart.value) {
      chart.value.dispose()
      chart.value = echarts.init(elRef.value)
      render()
    }
  })

  watch(
    () => optionFn(),
    () => render(),
    { deep: true }
  )

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chart.value?.dispose()
    chart.value = null
  })

  return { chart, render, resize }
}
