import { ref, computed } from 'vue'
import { CrawlerConfig, ExportType } from '@/types'
import { handleRequestData } from './handleRequestData'
import { handleResponseData } from './handleResponseData'
import { useCrawlerRequest } from '../useCrawlerRequest'
import { randomDelayFn, exportToExcelFn } from '@/utils/utils'

export function useCrawlerSubportOrDrainageData({
  reqUrls,
  exportType,
}: {
  reqUrls: string[]
  exportType: ExportType
}) {
  // 状态
  const allCrawledData = ref<any[]>([]) // 爬取的数据list
  const isAutoCrawling = ref(false) // 是否正在自动爬取
  const isPaused = ref(false) // 是否暂停
  const currentPage = ref(0) // 当前爬取到的页码
  const crawlerConfig = ref<CrawlerConfig>({
    // 爬取的配置
    startPage: 1,
    endPage: 0,
    minInterval: 1,
    maxInterval: 5,
  })

  // 处理请求和响应
  const { capturedRequests, setupMessageListener, fetchInPageContext } = useCrawlerRequest(reqUrls)

  // 计算属性
  const selectedRequest = computed(() => capturedRequests.value[0])
  const dataCount = computed(() => allCrawledData.value.length)

  const statusText = computed(() => {
    if (isPaused.value) return `已暂停，当前爬取到第 ${currentPage.value} 页`
    if (isAutoCrawling.value) return `正在爬取第 ${currentPage.value} 页...`
    return '未开始'
  })

  // 开始/继续自动爬取
  async function startAutoCrawl() {
    if (!selectedRequest.value) {
      alert('请先在网站上操作，让插件捕获到接口请求！')
      return
    }

    const { startPage, endPage, minInterval, maxInterval } = crawlerConfig.value

    // 如果不是暂停后继续，则重置数据和页码
    if (!isPaused.value) {
      allCrawledData.value = []
      currentPage.value = startPage
    }

    isAutoCrawling.value = true
    isPaused.value = false

    let emptyCount = 0

    while (isAutoCrawling.value && !isPaused.value) {
      try {
        const { url, method, body, headers } = handleRequestData(selectedRequest.value, currentPage.value)

        const result = await fetchInPageContext(url, method, body, headers)

        const dataArray = handleResponseData(result)

        // endPage === 0的终止条件
        if (dataArray.length > 0) {
          allCrawledData.value.push(...dataArray)
          emptyCount = 0
        } else {
          emptyCount++
          if (emptyCount >= 2) {
            break
          }
        }
        // endPage === 0的终止条件
        // if (endPage === 0 && data.totalCount && data.limit) {
        //   const totalPages = Math.ceil(data.totalCount / data.limit)
        //   if (currentPage.value >= totalPages) {
        //     break
        //   }
        // }
      } catch (error: any) {
        console.error('爬取失败:', error)
        alert(`爬取出错：${error.message}`)
        break
      }

      // 页码递增
      currentPage.value++

      // endPage大于0的终止条件
      if (endPage > 0 && currentPage.value > endPage) {
        break
      }

      // 随机延迟
      await randomDelayFn({ minInterval, maxInterval })
    }

    // 如果不是暂停，则结束爬取
    if (!isPaused.value) {
      isAutoCrawling.value = false
      currentPage.value = 0
      exportSubportOrDrainageExcel()
    }
  }

  // 暂停爬取
  function pauseCrawl() {
    isPaused.value = true
    console.log(`⏸️ 暂停爬取，当前页码: ${currentPage.value}`)
  }

  // 停止爬取（保留数据，清除状态）
  function stopCrawl() {
    isAutoCrawling.value = false
    isPaused.value = false
    currentPage.value = 0
    console.log('⏹️ 停止爬取，已收集数据保留')
  }

  // 导出Excel
  function exportSubportOrDrainageExcel() {
    exportToExcelFn({ data: allCrawledData, exportType })
  }

  // 清空数据（完全重置）
  function clearData() {
    if (confirm('确定要清空所有已收集的数据吗？')) {
      allCrawledData.value = []
      currentPage.value = 0
      console.log('🗑️ 数据已清空')
    }
  }

  // 初始化
  setupMessageListener()

  return {
    capturedRequests,
    // 状态
    allCrawledData,
    isAutoCrawling,
    isPaused,
    crawlerConfig,

    // 计算属性
    selectedRequest,
    dataCount,
    statusText,

    // 方法
    startAutoCrawl,
    pauseCrawl,
    stopCrawl,
    exportSubportOrDrainageExcel,
    clearData,
  }
}
