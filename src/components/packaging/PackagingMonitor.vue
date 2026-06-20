<script setup lang="ts">
/**
 * 包装区监控模块
 * - 当前包装品种（文字+图片）
 * - 包装规格选择（5kg/10kg/礼盒，高亮选中）
 * - 包装完成件数（每10件动画）
 * - 在线工人数（手动更新）
 */
import { ref, watch } from 'vue'
import { PackageCheck, Minus, Plus, Users, Boxes, Download } from 'lucide-vue-next'
import { usePackagingStore } from '@/stores/packaging'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'
import { SPEC_OPTIONS, FRUIT_VARIETIES } from '@/utils/mock'
import { exportCsv } from '@/utils/exportCsv'

const store = usePackagingStore()

const countDisplay = useAnimatedNumber(() => store.state.packedCount, 500)
const countStr = () => Math.round(countDisplay.value).toLocaleString()

const celebrateKey = ref(0)
watch(
  () => store.animateFlag,
  () => {
    celebrateKey.value++
  }
)

const specIcons: Record<string, string> = {
  '5kg': '📦',
  '10kg': '🗂️',
  gift: '🎁',
}

/**
 * 导出包装区数据 CSV
 * 内容：当前品种、规格、包装件数
 */
const handleExport = () => {
  const rows: unknown[][] = []
  rows.push(['包装区监控报表'])
  rows.push(['导出时间', new Date().toLocaleString()])
  rows.push([])
  rows.push(['当前品种', store.state.variety.name])
  const spec = SPEC_OPTIONS.find((o) => o.value === store.state.spec)
  rows.push(['包装规格', `${spec?.label || store.state.spec}（${spec?.desc || ''}）`])
  rows.push(['包装完成件数', store.state.packedCount])
  rows.push(['在线工人数量', store.state.workers])
  rows.push([])
  rows.push(['规格说明：', '5kg装=标准零售装 | 10kg装=家庭量贩装 | 礼盒装=精品礼盒装'])
  exportCsv('包装区数据', rows)
}
</script>

<template>
  <div class="panel-card p-5 h-full flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <h3 class="module-title">包装区监控</h3>
      <div class="flex items-center gap-2">
        <span
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style="background: var(--success-soft); color: var(--success)"
        >
          <PackageCheck :size="11" />
          正常运行
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

    <div class="flex items-center gap-3 mb-3">
      <!-- 品种图片 -->
      <div class="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border" style="border-color: var(--border-strong)">
        <img
          :src="store.state.variety.image"
          :alt="store.state.variety.name"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          class="absolute inset-0 ring-2 ring-inset rounded-xl"
          style="--tw-ring-color: var(--accent)"
        />
      </div>
      <!-- 品种信息 -->
      <div class="flex-1 min-w-0">
        <div class="metric-label">当前品种</div>
        <div class="font-display font-bold text-lg text-primary truncate">
          {{ store.state.variety.name }}
        </div>
        <!-- 品种切换 -->
        <div class="flex gap-1 mt-1.5">
          <button
            v-for="v in FRUIT_VARIETIES"
            :key="v.id"
            class="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
            :style="
              store.state.variety.id === v.id
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
            "
            @click="store.setVariety(v.id)"
          >
            {{ v.name.slice(0, 2) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 规格选择 -->
    <div class="mb-3">
      <div class="metric-label mb-1.5">包装规格</div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in SPEC_OPTIONS"
          :key="opt.value"
          class="rounded-lg p-2 text-left border transition-all hover:scale-[1.03] relative overflow-hidden"
          :style="
            store.state.spec === opt.value
              ? {
                  background: 'var(--accent-soft)',
                  borderColor: 'var(--accent)',
                  boxShadow: '0 0 0 1px var(--accent)',
                }
              : { background: 'var(--bg-elevated)', borderColor: 'var(--border)' }
          "
          @click="store.setSpec(opt.value)"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-base">{{ specIcons[opt.value] }}</span>
            <span
              class="font-display font-semibold text-xs"
              :style="
                store.state.spec === opt.value
                  ? { color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
              "
            >
              {{ opt.label }}
            </span>
          </div>
          <div class="text-[9px] text-muted mt-0.5">{{ opt.desc }}</div>
          <div
            v-if="store.state.spec === opt.value"
            class="absolute top-0 right-0 w-0 h-0"
            style="border-left: 12px solid transparent; border-top: 12px solid var(--accent)"
          />
        </button>
      </div>
    </div>

    <!-- 件数 + 工人 -->
    <div class="grid grid-cols-2 gap-2.5 mt-auto">
      <!-- 包装完成件数 -->
      <div
        class="rounded-xl p-3 flex flex-col"
        style="background: var(--bg-elevated)"
      >
        <div class="flex items-center gap-1.5">
          <Boxes :size="13" style="color: var(--accent)" />
          <span class="metric-label">完成件数</span>
        </div>
        <div :key="celebrateKey" class="flex items-baseline gap-1 mt-1">
          <span class="animate-count-celebrate mono text-3xl font-bold text-primary leading-none">
            {{ countStr() }}
          </span>
          <span class="text-xs text-muted">件</span>
        </div>
        <div class="mt-1.5 text-[10px] text-muted">
          下一个里程碑：{{ Math.ceil(store.state.packedCount / 10) * 10 }} 件
        </div>
      </div>

      <!-- 在线工人 -->
      <div
        class="rounded-xl p-3 flex flex-col"
        style="background: var(--bg-elevated)"
      >
        <div class="flex items-center gap-1.5">
          <Users :size="13" style="color: var(--success)" />
          <span class="metric-label">在线工人</span>
        </div>
        <div class="flex items-baseline gap-1 mt-1">
          <span class="mono text-3xl font-bold leading-none" style="color: var(--success)">
            {{ store.state.workers }}
          </span>
          <span class="text-xs text-muted">人</span>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5">
          <button
            class="w-6 h-6 rounded-md flex items-center justify-center border transition-all hover:scale-110 active:scale-95"
            style="border-color: var(--border-strong); background: var(--bg-card)"
            @click="store.adjustWorkers(-1)"
          >
            <Minus :size="12" class="text-secondary" />
          </button>
          <button
            class="w-6 h-6 rounded-md flex items-center justify-center border transition-all hover:scale-110 active:scale-95"
            style="border-color: var(--accent); background: var(--accent-soft)"
            @click="store.adjustWorkers(1)"
          >
            <Plus :size="12" style="color: var(--accent)" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
