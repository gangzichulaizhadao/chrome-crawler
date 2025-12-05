import * as XLSX from 'xlsx'
import { handleExportData } from '@/composables/useCrawlerSubportOrDrainageData/handleExportData'
import type { RandomDelayFn, exportToExcelFnParams } from '@/types/utils'

// 处理url
export function getShortUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.pathname + urlObj.search
  } catch (e) {
    return url
  }
}

// 格式化时间
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

// 随机延迟函数
export const randomDelayFn: RandomDelayFn = async ({ minInterval = 1, maxInterval = 5 }) => {
  const interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval
  await new Promise((resolve) => setTimeout(resolve, interval * 1000))
}

// 导出Excel
export async function exportToExcelFn({ data, exportType }: exportToExcelFnParams): Promise<void> {
  if (data.value.length === 0) {
    alert('没有数据可导出！')
    return
  }

  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 处理导出数据
    const { exportData, carrierName } = await handleExportData(data.value, exportType)

    // 将数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, exportType)

    // 生成 Excel 文件并下载
    const fileTime = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')
    const fileName = `${exportType}-${carrierName}_${fileTime}.xlsx`
    XLSX.writeFile(workbook, fileName)

    console.log('✅ Excel 导出成功:', fileName)
  } catch (error) {
    console.error('❌ Excel 导出失败:', error)
    alert(`导出失败：${error}`)
  }
}

// 防抖
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>): void {
    const context = this

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}
