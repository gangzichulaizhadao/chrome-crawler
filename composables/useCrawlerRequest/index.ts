import { ref } from 'vue'
import { CapturedRequest, CrawlerMessage, PostMessageType } from '@/types'

export function useCrawlerRequest(reqUrls: string[], channelNumberReqUrls?: string[]) {
  // 被捕获的请求list
  const capturedRequests = ref<CapturedRequest[]>([])
  // 被捕获的通道号list
  const capturedChannelNumberRequests = ref<any[]>([])
  // 请求ID计数器
  let requestIdCounter = 0
  // 等待响应的请求
  const pendingRequests = new Map<number, { resolve: Function; reject: Function }>()

  // 监听消息
  function setupMessageListener() {
    // 消息监听器
    const messageListener = (event: MessageEvent<CrawlerMessage>) => {
      if (event.source !== window) {
        return
      }

      const { type, data } = event.data

      if (type === PostMessageType.CRAWLER_REQUEST_CAPTURED) {
        // if (isAutoCrawling.value || isAllCrawling.value) {
        //   return
        // }
        handleRequestCaptured(data)
      } else if (type === PostMessageType.CRAWLER_FETCH_RESPONSE) {
        handleFetchResponse(event.data)
      } else if (type === PostMessageType.USER_NAME) {
        handleUserName(data)
      }
    }
    window.addEventListener('message', messageListener)
  }

  // 处理捕获的请求
  function handleRequestCaptured(req: CapturedRequest) {
    const isTrue: boolean = reqUrls.some((item) => req.url.includes(item))
    if (isTrue) {
      // 如果需要抓取，则清空之前的请求，并添加新的请求
      capturedRequests.value = []
      capturedRequests.value.push(req)
    }
    if (channelNumberReqUrls && channelNumberReqUrls.length > 0) {
      const isChannelNumber: boolean = channelNumberReqUrls.some((item) => req.url.includes(item))
      if (isChannelNumber) {
        capturedChannelNumberRequests.value = []
        capturedChannelNumberRequests.value.push(req)
      }
    }
  }

  // 处理爬虫的fetch响应
  function handleFetchResponse(message: CrawlerMessage) {
    const { requestId, success, data, error } = message
    const callback = pendingRequests.get(requestId!)

    if (callback) {
      success ? callback.resolve(data) : callback.reject(new Error(error))
      pendingRequests.delete(requestId!)
    }
  }

  // 处理登录接口的返回用户名
  function handleUserName(userName: string) {
    chrome.storage.local
      .set({ USER_NAME: userName })
      .then(() => {
        console.log('USER_NAME is set local')
      })
      .catch((err: any) => {
        console.log('🚀 ~ USER_NAME is not set local:', err)
      })
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

  return {
    capturedRequests,
    capturedChannelNumberRequests,

    setupMessageListener,
    fetchInPageContext,
  }
}
