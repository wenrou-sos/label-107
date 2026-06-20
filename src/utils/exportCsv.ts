/**
 * CSV 导出工具函数
 * - UTF-8 with BOM 编码，确保 Excel 打开中文不乱码
 * - 自动转义包含逗号、引号、换行的字段
 * - 文件名带时间戳
 */

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
 * 格式：名称_YYYY-MM-DD_HH-mm.csv
 */
export function generateFileName(baseName: string): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}-${pad(d.getMinutes())}`
  return `${baseName}_${date}_${time}.csv`
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
