import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import qs from 'qs'
import { CapturedRequest, PageParamInfo, ParsedRequest, CrawlerConfig, CrawlerMessage, PostMessageType } from '~/types'
import { handleRequestData, allCrawlByCporttabname } from './handleRequestData'
import { handleResponseData } from './handleResponseData'
import { handleExportData } from './handleExportData'
import { randomDelayFn } from '~/utils/utils'

export function useCrawler() {
  // 状态
  let userName = '' // 用户名
  const capturedRequests = ref<CapturedRequest[]>([]) // 被捕获的请求list
  const channelNumberList = ref<any[]>([]) // 通道号list
  const channelObj = ref<any>({}) // 通道号对象
  const allCrawledData = ref<any[]>([]) // 爬取的数据list
  const isAllCrawling = ref(false) // 是否正在全量爬取
  const isAutoCrawling = ref(false) // 是否正在自动爬取
  const isPaused = ref(false) // 是否暂停
  const currentPage = ref(0) // 当前爬取到的页码
  const selectedRequestIndex = ref(0) // 选中的请求索引
  const crawlerConfig = ref<CrawlerConfig>({
    // 爬取的配置
    startPage: 1,
    endPage: 0,
    minInterval: 1,
    maxInterval: 5,
  })

  // 计算属性
  const selectedRequest = computed(() => capturedRequests.value[selectedRequestIndex.value])
  const dataCount = computed(() => allCrawledData.value.length)
  const statusText = computed(() => {
    if (isPaused.value) return `已暂停，当前爬取到第 ${currentPage.value} 页`
    if (isAutoCrawling.value) return `正在爬取第 ${currentPage.value} 页...`
    return '未开始'
  })

  // 请求ID计数器
  const pendingRequests = new Map<number, { resolve: Function; reject: Function }>()
  let requestIdCounter = 0

  // 监听消息
  function setupMessageListener() {
    window.addEventListener('message', (event: MessageEvent<CrawlerMessage>) => {
      if (event.source !== window) return

      const { type, data } = event.data

      if (type === PostMessageType.CRAWLER_REQUEST_CAPTURED) {
        if (isAutoCrawling.value || isAllCrawling.value) {
          return
        }
        handleRequestCaptured(data)
      } else if (type === PostMessageType.CRAWLER_FETCH_RESPONSE) {
        handleFetchResponse(event.data)
      } else if (type === 'USER_NAME') {
        handleUserName(data)
      }
    })
  }

  // 处理捕获的请求
  function handleRequestCaptured(req: CapturedRequest) {
    // 只记录可能是分页接口的请求
    const reqType: string[] = ['page', 'list', 'query', 'datagrid.action']
    const flag: boolean = reqType.some((item) => req.url.includes(item))
    if (!flag) return
    capturedRequests.value.unshift(req)
    if (capturedRequests.value.length > 20) capturedRequests.value.pop() // 只保留最近20个
  }

  // 处理fetch响应
  function handleFetchResponse(message: CrawlerMessage) {
    const { requestId, success, data, error } = message
    const callback = pendingRequests.get(requestId!)

    if (callback) {
      if (success) {
        callback.resolve(data)
      } else {
        callback.reject(new Error(error))
      }
      pendingRequests.delete(requestId!)
    }
  }

  // 处理用户名
  function handleUserName(data: string) {
    userName = data
    console.log('userName', userName);
  }

  // 通过页面上下文发起请求
  function fetchInPageContext(
    url: string,
    method: string = 'GET',
    body: any = null,
    headers: Record<string, string> | null = null
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = ++requestIdCounter

      pendingRequests.set(requestId, { resolve, reject })

      const messageData = {
        type: PostMessageType.CRAWLER_FETCH_REQUEST,
        requestId,
        data: { url, method, body, headers },
      }
      console.log("window.postMessage=-=-=-=-messageData",messageData)
      window.postMessage(messageData, '*')

      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId)
          console.error('❌ 请求超时, requestId:', requestId)
          reject(new Error('请求超时'))
        }
      }, 30000)
    })
  }

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
        if (dataArray && dataArray.length > 0) {
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
      exportToExcel()
    }
  }

  // 全量爬取
  async function allCrawl() {
    // capturedRequests.value[0]  子端口
    // capturedRequests.value[1]  通道号
    const { startPage, endPage, minInterval, maxInterval } = crawlerConfig.value


    channelNumberList.value = []
    channelObj.value = {}
    allCrawledData.value = []

    isAllCrawling.value = true
    currentPage.value = startPage

    let emptyCount = 0

    // 爬取全部的通道号，channelNumberList
    while (true) {
      try {
        const { url, method, body, headers } = handleRequestData(capturedRequests.value[1], currentPage.value)

        const result = await fetchInPageContext(url, method, body, headers)

        const dataArray = handleResponseData(result)

        if (dataArray.length > 0) {
          channelNumberList.value.push(...dataArray)
          emptyCount = 0
        } else {
          emptyCount++
          if (emptyCount >= 2) {
            break
          }
        }
      } catch (error: any) {
        console.error('爬取失败:', error)
        alert(`爬取出错：${error.message}`)
        break
      }

      currentPage.value++

      // 随机延迟
      await randomDelayFn({ minInterval, maxInterval })
    }

    // 根据爬取的全部通道号，爬取每个通道号下的所有的子端口数据
    for (const item of channelNumberList.value) {
      currentPage.value = startPage
      emptyCount = 0

      channelObj.value[item.accessno] = []

      while (true) {
        try {
          const { url, method, body, headers } = allCrawlByCporttabname(capturedRequests.value, currentPage.value, item)

          const result = await fetchInPageContext(url, method, body, headers)
          const dataArray = handleResponseData(result)

         

          if (dataArray.length > 0) {
            channelObj.value[item.accessno].push(...dataArray)
            allCrawledData.value.push(...dataArray)
            emptyCount = 0
          } else {
            emptyCount++
            if (emptyCount >= 2) {
              break
            }
          }
        } catch (error) {
          console.log('🚀 ~ allCrawl ~ error:', error)
        }

        currentPage.value++

        // 如果endPage大于0，并且当前页码大于endPage，则停止爬取
        if (endPage > 0 && currentPage.value > endPage) {
          break
        }

        // 随机延迟
        await randomDelayFn({ minInterval, maxInterval })
      }
    }

    console.log('🚀 ~ allCrawl ~ channelObj.value:', channelObj.value);
    

    isAllCrawling.value = false
    exportToExcel()
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
  function exportToExcel() {
    if (allCrawledData.value.length === 0) {
      alert('没有数据可导出！')
      return
    }

    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 处理导出数据
      const { exportData, name } = handleExportData(allCrawledData.value, userName)

      // 将数据转换为工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, '子端口')

      // 生成 Excel 文件并下载
      const fileName = `子端口-${name}_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.xlsx`
      XLSX.writeFile(workbook, fileName)

      console.log('✅ Excel 导出成功:', fileName)
    } catch (error) {
      console.error('❌ Excel 导出失败:', error)
      alert(`导出失败：${error}`)
    }
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
    // 状态
    capturedRequests,
    channelNumberList,
    channelObj,
    allCrawledData,
    isAllCrawling,
    isAutoCrawling,
    isPaused,
    currentPage,
    selectedRequestIndex,
    crawlerConfig,

    // 计算属性
    selectedRequest,
    dataCount,
    statusText,

    // 方法
    startAutoCrawl,
    pauseCrawl,
    stopCrawl,
    exportToExcel,
    clearData,
    allCrawl,
  }
}
