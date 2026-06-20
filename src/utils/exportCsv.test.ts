import { describe, it, expect } from 'vitest'
import { escapeCsvField, toCsv, generateFileName, STATUS_LABELS } from '@/utils/exportCsv'

describe('CSV 导出工具函数', () => {
  describe('escapeCsvField 字段转义', () => {
    it('空值返回空字符串', () => {
      expect(escapeCsvField(null)).toBe('')
      expect(escapeCsvField(undefined)).toBe('')
    })

    it('普通字符串原样返回', () => {
      expect(escapeCsvField('苹果')).toBe('苹果')
      expect(escapeCsvField('运行中')).toBe('运行中')
      expect(escapeCsvField('123.45')).toBe('123.45')
    })

    it('包含逗号 - 加双引号包裹', () => {
      expect(escapeCsvField('A,B,C')).toBe('"A,B,C"')
      expect(escapeCsvField('分选线,1号,2号')).toBe('"分选线,1号,2号"')
    })

    it('包含引号 - 包裹并转义内部引号', () => {
      expect(escapeCsvField('他说"你好"')).toBe('"他说""你好"""')
    })

    it('包含逗号和引号组合', () => {
      expect(escapeCsvField('A,"B",C')).toBe('"A,""B"",C"')
    })

    it('包含换行符 - 加双引号', () => {
      expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
      expect(escapeCsvField('A\r\nB')).toBe('"A\r\nB"')
    })

    it('数字和布尔转字符串', () => {
      expect(escapeCsvField(123)).toBe('123')
      expect(escapeCsvField(0)).toBe('0')
      expect(escapeCsvField(true)).toBe('true')
    })
  })

  describe('toCsv CSV 拼接', () => {
    it('以 UTF-8 BOM 开头', () => {
      const result = toCsv([['a', 'b']])
      expect(result.charCodeAt(0)).toBe(0xfeff)
    })

    it('简单二维数组正确拼接', () => {
      const rows = [
        ['姓名', '年龄'],
        ['张三', 25],
        ['李四', 30],
      ]
      const result = toCsv(rows)
      const withoutBom = result.slice(1)
      expect(withoutBom).toBe('姓名,年龄\r\n张三,25\r\n李四,30')
    })

    it('含转义字符的行正确拼接', () => {
      const rows = [
        ['详情', '状态'],
        ['显示"错误",请检查', '运行中'],
      ]
      const result = toCsv(rows)
      const withoutBom = result.slice(1)
      expect(withoutBom).toBe('详情,状态\r\n"显示""错误"",请检查",运行中')
    })
  })

  describe('generateFileName 文件名生成', () => {
    it('包含基础名称和时间戳格式', () => {
      const name = generateFileName('分选线数据')
      expect(name.startsWith('分选线数据_')).toBe(true)
      expect(name.endsWith('.csv')).toBe(true)
      // 格式: 分选线数据_YYYY-MM-DD_HH-mm.csv
      const pattern = /^分选线数据_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/
      expect(pattern.test(name)).toBe(true)
    })

    it('不同基础名生成对应前缀', () => {
      expect(generateFileName('告警事件').startsWith('告警事件_')).toBe(true)
      expect(generateFileName('效率分析').startsWith('效率分析_')).toBe(true)
    })
  })

  describe('STATUS_LABELS 状态字典', () => {
    it('包含所有需要的状态标签', () => {
      expect(STATUS_LABELS.running).toBe('运行中')
      expect(STATUS_LABELS.stopped).toBe('已停机')
      expect(STATUS_LABELS.fault).toBe('故障')
      expect(STATUS_LABELS.pending).toBe('待处理')
      expect(STATUS_LABELS.received).toBe('已接收')
      expect(STATUS_LABELS.resolved).toBe('已完成')
    })
  })
})
