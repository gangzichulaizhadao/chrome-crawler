import { ref, computed } from 'vue'
import { handleRequestData, handleRequestData1 } from './handleRequestData'
import { handleResponseData } from './handleResponseData'
import { useCrawlerRequest } from '../useCrawlerRequest'
import { subportReqUrls, channelNumberReqUrls } from '@/utils/config'
import { exportToExcelFn } from '@/utils/utils'
import { ChannelObjItem, ChannelNumberItem, ExportTypeEnum } from '@/types'

export function useCrawlerByChannelNumber() {
  // 状态
  // 是否正在爬取通道号
  const isCrawlingChannelNumber = ref(false)
  // 通道号list
  const channelNumberList = ref<ChannelNumberItem[]>([])
  // 通道号list备份
  const channelNumberListBackup = ref<ChannelNumberItem[]>([])
  // 通道号对象配置
  const channelObj = ref<Record<string, ChannelObjItem>>({})
  // 爬取通道号的page
  const currentPage = ref(0)

  // 是否正在根据通道号爬取子端口数据
  const isCrawlingSubportData = ref(false)
  // 是否暂停
  const isPausedCrawleSubport = ref(false)
  // 爬取的所有的子端口数据
  const allCrawledSubportList = ref<any[]>([])

  // 计算属性
  // 通道号数量
  const channelNumberDataCount = computed(() => channelNumberList.value.length)
  const subportDataCount = computed(() => allCrawledSubportList.value.length)
  // 状态文本
  const statusText = computed(() => {
    if (isCrawlingSubportData.value) {
      return `状态：正在爬取子端口数据... | 共收集：<span class="highlight">${subportDataCount.value}</span> 条子端口数据`
    }
    if (!isCrawlingSubportData.value && subportDataCount.value > 0) {
      return `状态：爬取完成 | 共收集：<span class="highlight">${subportDataCount.value}</span> 条子端口数据`
    }
    if (isCrawlingChannelNumber.value) {
      return `状态：正在爬取通道号... | 共收集：<span class="highlight">${channelNumberDataCount.value}</span> 条通道号数据`
    }
    if (!isCrawlingChannelNumber.value && channelNumberDataCount.value > 0) {
      return `状态：爬取完成 | 共收集：<span class="highlight">${channelNumberDataCount.value}</span> 条通道号数据`
    }
    return '状态：未开始'
  })

  // 处理请求和响应
  const { capturedRequests, capturedChannelNumberRequests, setupMessageListener, fetchInPageContext } =
    useCrawlerRequest(subportReqUrls, channelNumberReqUrls)

  // 爬取所有的通道号
  async function crawlAllChannelNumber() {
    if (capturedChannelNumberRequests.value.length === 0) {
      alert('请先抓取通道号接口！')
      return
    }

    // 开始爬取
    isCrawlingChannelNumber.value = true

    // 重置状态
    channelNumberList.value = []
    channelNumberListBackup.value = []
    channelObj.value = {}
    currentPage.value = 1
    allCrawledSubportList.value = []

    // while循环结束的变量，如果连续2次为空，则停止爬取
    let emptyCount = 0

    // while循环爬取全部的通道号，channelNumberList
    while (true) {
      try {
        const { url, method, body, headers } = handleRequestData(
          capturedChannelNumberRequests.value[0],
          currentPage.value
        )

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
      await randomDelayFn({ minInterval: 1, maxInterval: 5 })
    }

    channelNumberListBackup.value = channelNumberList.value

    // 初始化通道号对象配置
    channelNumberList.value.forEach((item, index) => {
      channelObj.value[item.accessno] = {
        id: index + 1,
        accessno: item.accessno,
        list: [],
        isChecked: false, // 是否选中
        disabled: false, // 是否禁用
        startPage: 1, // 开始页码
        endPage: 0, // 结束页码
        currentPage: 0, // 当前页码
        allCrawled: false, // 是否爬取完成，如果为true，则不再爬取
      }
    })

    // 爬取结束
    isCrawlingChannelNumber.value = false
  }

  function handleChannelNumberList() {
    const checkedChannelNumbers = Object.values(channelObj.value)
      .filter((item: any) => {
        item.disabled = true
        return item?.isChecked
      })
      .map((item: any) => item?.accessno)
    channelNumberList.value = channelNumberListBackup.value.filter((item: any) =>
      checkedChannelNumbers.includes(item.accessno)
    )
  }

  // 根据通道号全量爬取
  async function crawlAllDataByChannelNumber() {
    if (capturedRequests.value.length === 0) {
      alert('请先抓取子端口接口！')
      return
    }

    if (channelNumberList.value.length === 0) {
      alert('通道号数据为空，请先爬取全部的通道号！')
      return
    }

    let hasChecked = false
    for (const key in channelObj.value) {
      hasChecked = channelObj.value[key].isChecked
      if (hasChecked) break
    }
    if (!hasChecked) {
      alert('请勾选要爬取的通道号')
      return
    }

    // 如果不是暂停后继续，则重置数据
    if (!isPausedCrawleSubport.value) {
      allCrawledSubportList.value = []
      const checkedChannelNumbers = Object.values(channelObj.value)
      checkedChannelNumbers.forEach((item: any) => {
        item.list = []
        item.currentPage = 0
        item.allCrawled = false
      })
      // 根据用户选择，筛选数据
      handleChannelNumberList()
    }

    // 开始爬取
    isCrawlingSubportData.value = true

    // 根据爬取的全部通道号，爬取每个通道号下的所有的子端口数据
    for (const item of channelNumberList.value) {
      // 如果已经爬取完成，则跳过
      if (channelObj.value[item.accessno].allCrawled) {
        continue
      }

      // 设置当前页面
      const id = item.accessno
      // 如果不是暂停后继续，则重置当前页码
      if (!isPausedCrawleSubport.value) {
        channelObj.value[id].currentPage = channelObj.value[id].startPage
      }

      // 重置暂停状态，这行代码必须写在这不能写在for循环上面，因为页码也需要判断是否暂停的状态
      isPausedCrawleSubport.value = false

      // while循环结束的变量，如果连续2次为空，则停止爬取
      let emptyCount = 0

      while (isCrawlingSubportData.value && !isPausedCrawleSubport.value && !channelObj.value[id].allCrawled) {
        try {
          const { url, method, body, headers } = handleRequestData1(
            capturedRequests.value[0],
            channelObj.value[id].currentPage,
            item
          )

          const result = await fetchInPageContext(url, method, body, headers)

          const dataArray = handleResponseData(result)

          if (dataArray.length > 0) {
            channelObj.value[id].list.push(...dataArray)
            allCrawledSubportList.value.push(...dataArray)
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

        channelObj.value[id].currentPage++

        // 如果endPage大于0，并且当前页码大于endPage，则停止爬取
        if (channelObj.value[id].endPage > 0 && channelObj.value[id].currentPage > channelObj.value[id].endPage) {
          channelObj.value[id].currentPage--
          break
        }

        // 随机延迟
        await randomDelayFn({ minInterval: 1, maxInterval: 5 })
      }

      // 如果暂停，则跳出循环
      if (isPausedCrawleSubport.value) {
        break
      }

      // 设置此条爬取完成
      channelObj.value[id].allCrawled = true
      // channelObj.value[id].currentPage--
    }

    console.log(allCrawledSubportList.value, 'allCrawledSubportList.value')
    console.log(channelObj.value, 'channelObj.value')

    // 如果不是暂停，则结束爬取
    if (!isPausedCrawleSubport.value) {
      isCrawlingSubportData.value = false
      exportSubportByChannelNumberExcel()
    }
  }

  // 暂停爬取
  function pauseCrawleSubport() {
    isPausedCrawleSubport.value = true
  }

  // 停止爬取（保留数据，清除状态）
  function stopCrawleSubport() {
    isCrawlingSubportData.value = false
    isPausedCrawleSubport.value = false
    const checkedChannelNumbers = Object.values(channelObj.value)
    checkedChannelNumbers.forEach((item: any) => {
      item.list = []
      item.disabled = false
      item.currentPage = 0
      item.allCrawled = false
    })
    channelNumberList.value = channelNumberListBackup.value
    console.log('⏹️ 停止爬取，已收集数据保留')
  }

  // 导出Excel
  function exportSubportByChannelNumberExcel() {
    exportToExcelFn({ data: allCrawledSubportList, exportType: ExportTypeEnum.SUBPORT })
  }

  setupMessageListener()

  return {
    capturedChannelNumberRequests,
    // 爬取通道号
    isCrawlingChannelNumber,
    channelNumberList,
    channelObj,
    // 爬取子端口
    isCrawlingSubportData,
    isPausedCrawleSubport,
    allCrawledSubportList,

    statusText,

    crawlAllChannelNumber,
    crawlAllDataByChannelNumber,
    pauseCrawleSubport,
    stopCrawleSubport,
    exportSubportByChannelNumberExcel,
  }
}
