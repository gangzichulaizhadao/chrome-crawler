import { CapturedRequest, CrawlerMessage, PostMessageType } from '@/types'
import qs from 'qs'

export default defineUnlistedScript(() => {
  // 发送请求信息到 content script
  function sendRequestToExtension(requestInfo: CapturedRequest) {
    const message: CrawlerMessage = {
      type: PostMessageType.CRAWLER_REQUEST_CAPTURED,
      data: requestInfo,
    }
    window.postMessage(message, '*')
  }

  // 发送爬虫的fetch响应数据到 content script
  function sendFetchResponseToExtension(requestId: number, success: boolean, data: any) {
    const message: CrawlerMessage = {
      type: PostMessageType.CRAWLER_FETCH_RESPONSE,
      requestId,
      success,
    }
    success ? (message.data = data) : (message.error = data)

    window.postMessage(message, '*')
  }

  // 发送用户名称到 content script
  function sendUserNameToExtension(userName: string) {
    const message = {
      type: 'USER_NAME',
      data: userName,
    }
    window.postMessage(message, '*')
  }

  // 解析请求体
  function parseBodyFn(body: any) {
    let parsedBody: Record<string, any> | null = null
    if (body) {
      try {
        if (typeof body === 'string') {
          parsedBody = JSON.parse(body)
        }
      } catch (e) {
        parsedBody = body as any
      }
    }
    return parsedBody
  }

  // 监听来自 content script 的爬取请求
  window.addEventListener('message', async (event: MessageEvent<CrawlerMessage>) => {
    if (event.source !== window) return

    if (event.data.type === PostMessageType.CRAWLER_FETCH_REQUEST) {
      const requestId = event.data.requestId
      const { url, method, body, headers } = event.data.data

      try {
        const fetchOptions: RequestInit = {
          method: method || 'GET',
          credentials: 'include',
          headers: headers || {
            'Content-Type': 'application/json',
          },
        }

        // 确保有 Content-Type
        if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
          ;(fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
        }

        // 如果有请求体，添加到配置中
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
        }

        console.log('📤 发起请求:', url, fetchOptions)
        const response = await fetch(url, fetchOptions)

        const contentType = response.headers.get('content-type')
        let responseData: any

        if (contentType?.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        const data = {
          url,
          method,
          statusCode: response.status,
          statusText: response.statusText,
          response: responseData,
        }

        sendFetchResponseToExtension(requestId!, true, data)
      } catch (error: any) {
        console.log('🚀 ~ error:', error)
        sendFetchResponseToExtension(requestId!, false, error.message)
      }
    }
  })

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader
  const originalXHRSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method: string, url: string, ...args: any[]) {
    const _this = this as any
    _this._crawlerUrl = url
    _this._crawlerMethod = method
    _this._crawlerTimestamp = Date.now()
    _this._crawlerHeaders = {}
    return originalXHROpen.apply(_this, [method, url, ...args] as any)
  }

  XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string) {
    const _this = this as any
    if (!_this._crawlerHeaders) {
      _this._crawlerHeaders = {}
    }
    _this._crawlerHeaders[header] = value
    return originalSetRequestHeader.apply(_this, [header, value])
  }

  XMLHttpRequest.prototype.send = function (body) {
    const _this = this as any

    const parsedBody = parseBodyFn(body)

    const requestInfo: CapturedRequest = {
      url: _this._crawlerUrl,
      method: _this._crawlerMethod,
      body: parsedBody,
      headers: _this._crawlerHeaders || {},
      timestamp: _this._crawlerTimestamp,
      type: 'xhr',
    }

    // 江苏
    if (_this._crawlerUrl.includes('/api/login/auth')) {
      sendUserNameToExtension(parsedBody?.userAccount || '')
      console.log('江苏电信登录', parsedBody?.userAccount)
    }

    // 浙江
    if (_this._crawlerUrl.includes('/zjpdtc/sysUser/login.action')) {
      let body = qs.parse(parsedBody)
      body.data = JSON.parse(body.data)
      sendUserNameToExtension(body.data.loginname || '')
      console.log('浙江电信登录', body.data.loginname)
    }

    // 上海
    if (_this._crawlerUrl.includes('/pdtc/sysUser/login.action')) {
      let body = qs.parse(parsedBody)
      body.data = JSON.parse(body.data)
      sendUserNameToExtension(body.data.loginname || '')
      console.log('上海电信登录', body.data.loginname)
    }

    sendRequestToExtension(requestInfo)

    return originalXHRSend.apply(_this, [body] as any)
  }

  // 拦截 Fetch API
  const originalFetch = window.fetch

  window.fetch = function (...args: any[]) {
    const [resource, config] = args

    const parsedBody = parseBodyFn(config?.body)

    // 提取请求头
    const headers: Record<string, string> = {}
    if (config?.headers) {
      if (config.headers instanceof Headers) {
        config.headers.forEach((value: string, key: string) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, config.headers)
      }
    }

    // 记录请求
    const requestInfo: CapturedRequest = {
      url: typeof resource === 'string' ? resource : resource.url,
      method: config?.method || 'GET',
      body: parsedBody,
      headers,
      timestamp: Date.now(),
      type: 'fetch',
    }

    sendRequestToExtension(requestInfo)

    return originalFetch.apply(this, [...args] as any)
  }

  console.log('🕷️ 接口监控脚本已注入')
})
