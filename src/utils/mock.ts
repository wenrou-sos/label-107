/**
 * 数据模拟服务 - 模拟车间实时数据更新
 */
import type {
  SortingState,
  GradeItem,
  PackagingState,
  SpecOption,
  AlertEvent,
  FaultType,
  Urgency,
  EfficiencyRecord,
  EfficiencyDimension,
  FruitVariety,
  SpeedPoint,
} from '@/types'

/** 等级颜色配置 */
export const GRADE_COLORS: Record<string, string> = {
  premium: '#F5C242',
  first: '#34D9A4',
  second: '#4F8DFF',
  sub: '#FF9F4A',
}

/** 等级标签 */
export const GRADE_LABELS: Record<string, string> = {
  premium: '特级',
  first: '一级',
  second: '二级',
  sub: '次果',
}

/** 水果品种库 */
export const FRUIT_VARIETIES: FruitVariety[] = [
  {
    id: 'apple',
    name: '红富士苹果',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fresh%20red%20Fuji%20apples%20on%20a%20conveyor%20belt%20in%20a%20clean%20industrial%20sorting%20facility%2C%20soft%20studio%20lighting%2C%20top%20view%2C%20photorealistic&image_size=square',
    unit: 'kg',
  },
  {
    id: 'orange',
    name: '赣南脐橙',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fresh%20navel%20oranges%20on%20a%20conveyor%20belt%20in%20a%20clean%20industrial%20sorting%20facility%2C%20soft%20studio%20lighting%2C%20top%20view%2C%20photorealistic&image_size=square',
    unit: 'kg',
  },
  {
    id: 'pear',
    name: '皇冠雪梨',
    image:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fresh%20golden%20crown%20pears%20on%20a%20conveyor%20belt%20in%20a%20clean%20industrial%20sorting%20facility%2C%20soft%20studio%20lighting%2C%20top%20view%2C%20photorealistic&image_size=square',
    unit: 'kg',
  },
]

/** 包装规格选项 */
export const SPEC_OPTIONS: SpecOption[] = [
  { value: '5kg', label: '5kg 装', desc: '标准零售装' },
  { value: '10kg', label: '10kg 装', desc: '家庭量贩装' },
  { value: 'gift', label: '礼盒装', desc: '精品礼盒装' },
]

/** 故障类型配置 */
export const FAULT_CONFIG: Record<
  FaultType,
  { label: string; detail: string; locations: string[] }
> = {
  sensor: {
    label: '传感器失灵',
    detail: '称重传感器信号异常，读数波动超出阈值 ±0.3kg',
    locations: ['分选线 A - 工位 03', '分选线 B - 工位 07', '分选线 C - 工位 02'],
  },
  weight: {
    label: '重量偏差超限',
    detail: '实时重量与目标重量偏差超过 5%，需校准分选阈值',
    locations: ['分选线 A - 称重区', '分选线 B - 称重区', '分选线 C - 称重区'],
  },
  optical: {
    label: '光电识别错误',
    detail: '光电色选器识别置信度低于 85%，存在误判风险',
    locations: ['分选线 A - 色选区', '分选线 B - 色选区', '分选线 C - 色选区'],
  },
}

/** 紧急程度配置 */
export const URGENCY_CONFIG: Record<
  Urgency,
  { label: string; color: string; bg: string }
> = {
  high: { label: '紧急', color: '#FF4D5E', bg: 'rgba(255,77,94,0.12)' },
  medium: { label: '重要', color: '#FFA940', bg: 'rgba(255,169,64,0.12)' },
  low: { label: '一般', color: '#4F8DFF', bg: 'rgba(79,141,255,0.12)' },
}

/** 生成随机整数 */
export const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

/** 生成随机浮点数 */
export const randFloat = (min: number, max: number, digits = 2): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(digits))

/** 生成唯一 ID */
let seq = 0
export const genId = (): string => `ALT-${Date.now()}-${++seq}`

/** 生成当前时间字符串 */
export const nowStr = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 生成初始分选线状态 */
export const genSortingState = (): SortingState => ({
  todayTotal: randFloat(28.5, 42.8),
  sortingSpeed: randFloat(3.2, 5.6),
  status: 'running',
})

/** 推进分选线状态（每 5 秒） */
export const nextSortingState = (prev: SortingState): SortingState => {
  const delta = randFloat(0.02, 0.18)
  return {
    ...prev,
    todayTotal: parseFloat((prev.todayTotal + delta).toFixed(2)),
    sortingSpeed: randFloat(Math.max(2.8, prev.sortingSpeed - 0.4), prev.sortingSpeed + 0.5),
    status: prev.status === 'fault' ? 'fault' : 'running',
  }
}

/** 生成速度历史序列 */
export const genSpeedHistory = (n = 12): SpeedPoint[] => {
  const arr: SpeedPoint[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5000)
    const pad = (x: number) => String(x).padStart(2, '0')
    arr.push({
      time: `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`,
      value: randFloat(3.0, 5.8),
    })
  }
  return arr
}

/** 生成等级分布 */
export const genGradeDistribution = (total: number): GradeItem[] => {
  const premium = randFloat(0.18, 0.24)
  const first = randFloat(0.38, 0.46)
  const second = randFloat(0.22, 0.3)
  const subRaw = Math.max(0, 1 - premium - first - second)
  const sub = parseFloat(subRaw.toFixed(4))
  const adjust = premium + first + second + sub
  return [
    {
      grade: 'premium',
      label: GRADE_LABELS.premium,
      weight: parseFloat((total * (premium / adjust)).toFixed(2)),
      ratio: parseFloat(((premium / adjust) * 100).toFixed(1)),
      color: GRADE_COLORS.premium,
    },
    {
      grade: 'first',
      label: GRADE_LABELS.first,
      weight: parseFloat((total * (first / adjust)).toFixed(2)),
      ratio: parseFloat(((first / adjust) * 100).toFixed(1)),
      color: GRADE_COLORS.first,
    },
    {
      grade: 'second',
      label: GRADE_LABELS.second,
      weight: parseFloat((total * (second / adjust)).toFixed(2)),
      ratio: parseFloat(((second / adjust) * 100).toFixed(1)),
      color: GRADE_COLORS.second,
    },
    {
      grade: 'sub',
      label: GRADE_LABELS.sub,
      weight: parseFloat((total * (sub / adjust)).toFixed(2)),
      ratio: parseFloat(((sub / adjust) * 100).toFixed(1)),
      color: GRADE_COLORS.sub,
    },
  ]
}

/** 生成初始包装状态 */
export const genPackagingState = (): PackagingState => ({
  variety: FRUIT_VARIETIES[0],
  spec: '5kg',
  packedCount: randInt(120, 280),
  workers: randInt(6, 9),
})

/** 随机生成故障事件 */
export const genFaultEvent = (): AlertEvent => {
  const types: FaultType[] = ['sensor', 'weight', 'optical']
  const urgencies: Urgency[] = ['high', 'medium', 'low']
  const type = types[randInt(0, types.length - 1)]
  const cfg = FAULT_CONFIG[type]
  const urgency = urgencies[randInt(0, urgencies.length - 1)]
  return {
    id: genId(),
    type,
    typeLabel: cfg.label,
    location: cfg.locations[randInt(0, cfg.locations.length - 1)],
    urgency,
    createdAt: nowStr(),
    status: 'pending',
    detail: cfg.detail,
  }
}

/** 生成效率分析数据 */
export const genEfficiencyData = (dim: EfficiencyDimension): EfficiencyRecord[] => {
  if (dim === 'hour') {
    const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
    return labels.map((label) => {
      const planned = randFloat(3.8, 4.6)
      const actual = randFloat(planned * 0.82, planned * 1.08)
      const deviation = parseFloat((((actual - planned) / planned) * 100).toFixed(1))
      return { label, actual: parseFloat(actual.toFixed(2)), planned: parseFloat(planned.toFixed(2)), deviation }
    })
  }
  const labels = ['早班 08-16', '中班 16-24', '夜班 00-08']
  return labels.map((label) => {
    const planned = randFloat(28, 38)
    const actual = randFloat(planned * 0.85, planned * 1.06)
    const deviation = parseFloat((((actual - planned) / planned) * 100).toFixed(1))
    return { label, actual: parseFloat(actual.toFixed(2)), planned: parseFloat(planned.toFixed(2)), deviation }
  })
}

/** 工人姓名池 */
export const WORKER_NAMES = ['张师傅', '李工', '王班长', '赵技师', '陈师傅']
