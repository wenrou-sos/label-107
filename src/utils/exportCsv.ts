/**
 * CSV 导出工具函数
 * - UTF-8 with BOM 编码，确保 Excel 打开中文不乱码
 * - 自动转义包含逗号、引号、换行的字段
 * - 文件名带时间戳
 * - 支持按设置项选择 12/24 小时时间格式（覆盖导出时间、业务时间列）
 */
import type { CsvTimeFormat } from '@/types'

/** 获取当前 CSV 时间格式设置（避免循环依赖，运行时读取） */
function getCsvTimeFormat(): CsvTimeFormat {
  try {
    const raw = localStorage.getItem('app-settings')
    if (!raw) return '24h'
    const parsed = JSON.parse(raw) as { csvTimeFormat?: CsvTimeFormat }
    return parsed.csvTimeFormat === '12h' ? '12h' : '24h'
  } catch {
    return '24h'
  }
}

/** 根据时间格式设置生成"年-月-日 时:分:秒"字符串 */
function formatDateTime(d: Date, format: CsvTimeFormat): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (format === '12h') {
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${date} ${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`
  }
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 尝试将各种格式的时间字符串解析为 Date 对象
 * 支持：
 *  - "YYYY/MM/DD HH:mm:ss" / "YYYY-MM-DD HH:mm:ss"
 *  - "HH:mm:ss"（默认补今天的日期）
 *  - ISO 字符串
 */
function parseDateTime(input: string): Date | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // 1) 尝试直接交给 Date 解析（ISO / 浏览器支持的格式）
  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  // 2) "HH:mm:ss"（只有时间，没有日期）→ 补今天
  const hmMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (hmMatch) {
    const today = new Date()
    today.setHours(parseInt(hmMatch[1], 10), parseInt(hmMatch[2], 10), parseInt(hmMatch[3], 10), 0)
    return today
  }

  // 3) "YYYY/MM/DD HH:mm:ss"（zh-CN toLocaleString 格式）
  const cnMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})$/)
  if (cnMatch) {
    return new Date(
      parseInt(cnMatch[1], 10),
      parseInt(cnMatch[2], 10) - 1,
      parseInt(cnMatch[3], 10),
      parseInt(cnMatch[4], 10),
      parseInt(cnMatch[5], 10),
      parseInt(cnMatch[6], 10)
    )
  }

  return null
}

/**
 * 按当前 CSV 时间格式设置重格式化任意时间字符串
 * 规则：
 *  - 如果输入是纯时间 HH:mm:ss，则输出也只保留 HH:mm:ss（加 AM/PM）
 *  - 如果输入包含日期，则输出完整 YYYY-MM-DD HH:mm:ss（加 AM/PM）
 *  - 解析失败则原样返回
 */
export function reformatTime(input: string | undefined | null): string {
  if (input === undefined || input === null) return ''
  const str = String(input).trim()
  if (!str) return ''

  const fmt = getCsvTimeFormat()
  const d = parseDateTime(str)
  if (!d) return str

  const pad = (n: number) => String(n).padStart(2, '0')

  // 判断输入是否只有时间（没有日期）
  const onlyTime = /^\d{1,2}:\d{2}:\d{2}$/.test(str)
  if (onlyTime) {
    if (fmt === '12h') {
      let h = d.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`
    }
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  // 完整日期时间
  return formatDateTime(d, fmt)
}

/**
 * 转义 CSV 字段
 * 如果字段包含逗号、双引号、换行符，则用双引号包裹，并将内部双引号转义为 ""
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needQuote = /[",\n\r]/.test(str)
  if (needQuote) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * 将二维数组转换为 CSV 字符串（UTF-8 with BOM）
 * @param rows 数据行，第一行通常是表头
 */
export function toCsv(rows: unknown[][]): string {
  const BOM = '\uFEFF'
  const lines = rows.map((row) => row.map(escapeCsvField).join(','))
  return BOM + lines.join('\r\n')
}

/**
 * 生成带时间戳的文件名
 * 格式：名称_YYYY-MM-DD_HH-mm.csv（始终 24 小时制，避免文件名出现 AM/PM 空格）
 */
export function generateFileName(baseName: string): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}-${pad(d.getMinutes())}`
  return `${baseName}_${date}_${time}.csv`
}

/**
 * 按当前设置的时间格式生成"导出时间"字符串
 * 供 CSV 内容中的导出时间字段使用
 */
export function formatExportTime(d: Date = new Date()): string {
  return formatDateTime(d, getCsvTimeFormat())
}

/**
 * 触发浏览器下载文件
 * @param content 文件内容
 * @param fileName 文件名
 * @param mimeType MIME 类型，默认 text/csv
 */
export function downloadFile(
  content: string,
  fileName: string,
  mimeType = 'text/csv;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 快捷：导出 CSV（一步到位）
 * @param baseName 文件名前缀（不含时间和扩展名）
 * @param rows 数据（第一行通常为表头）
 */
export function exportCsv(baseName: string, rows: unknown[][]): void {
  const csv = toCsv(rows)
  const fileName = generateFileName(baseName)
  downloadFile(csv, fileName)
}

/**
 * 状态码中文映射
 */
export const STATUS_LABELS: Record<string, string> = {
  running: '运行中',
  stopped: '已停机',
  fault: '故障',
  pending: '待处理',
  pushed: '已推送',
  received: '已接收',
  resolved: '已完成',
}
