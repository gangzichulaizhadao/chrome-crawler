// 类型定义文件

export enum PostMessageType {
  CRAWLER_REQUEST_CAPTURED = 'CRAWLER_REQUEST_CAPTURED', // 捕获xhr和fetch的请求
  // CRAWLER_RESPONSE_CAPTURED = 'CRAWLER_RESPONSE_CAPTURED',
  CRAWLER_FETCH_REQUEST = 'CRAWLER_FETCH_REQUEST', // 通过上下文发起请求
  CRAWLER_FETCH_RESPONSE = 'CRAWLER_FETCH_RESPONSE', // 捕获通过上下文发起请求的响应
  USER_NAME = 'USER_NAME', // 捕获登录接口的返回用户名
}

export interface CapturedRequest {
  url: string
  method: string
  body?: any
  headers?: Record<string, string>
  timestamp: number
  type: 'xhr' | 'fetch'
}

export interface CrawlerConfig {
  startPage: number
  endPage: number
  minInterval: number
  maxInterval: number
}

// 消息类型
export type MessageType =
  | 'CRAWLER_REQUEST_CAPTURED'
  // | 'CRAWLER_RESPONSE_CAPTURED'
  | 'CRAWLER_FETCH_REQUEST'
  | 'CRAWLER_FETCH_RESPONSE'
  | 'USER_NAME'

export interface CrawlerMessage {
  type: MessageType
  data?: any
  requestId?: number
  success?: boolean
  error?: string
}

export type ChannelObjItem = {
  id: number
  accessno: number
  list: any[]
  isChecked: boolean
  disabled: boolean
  startPage: number
  endPage: number
  currentPage: number
  allCrawled: boolean
}

export type ChannelNumberItem = {
  accessno: number
}

export enum ExportTypeEnum {
  SUBPORT = '子端口',
  DRAINAGE = '引流',
}

export type ExportType = '子端口' | '引流'
