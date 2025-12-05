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
export const randomDelayFn: RandomDelayFn = async ({ minInterval = 3, maxInterval = 8 }) => {
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

// 重试函数 - 用于处理请求失败的情况
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number // 最大重试次数
    retryDelay?: number // 重试延迟（毫秒）
    retryDelayMultiplier?: number // 每次重试延迟的倍数
    shouldRetry?: (error: any) => boolean // 判断是否需要重试的函数
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    retryDelayMultiplier = 2,
    shouldRetry = (error: any) => {
      // 默认对507、429、503等错误进行重试
      const statusCode = error?.statusCode || error?.response?.status
      return [507, 429, 503, 500].includes(statusCode)
    },
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error: any) {
      lastError = error
      console.warn(`请求失败 (第 ${attempt + 1}/${maxRetries + 1} 次尝试):`, error.message)

      // 如果已经是最后一次尝试，或者不应该重试，则抛出错误
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      // 计算延迟时间
      const delay = retryDelay * Math.pow(retryDelayMultiplier, attempt)
      console.log(`等待 ${delay / 1000} 秒后重试...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}