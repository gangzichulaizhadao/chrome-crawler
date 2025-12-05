// 插件允许访问的网站
export const host_permissions: string[] = [
  'http://172.16.11.210/*', // 测试
  'https://dkgl.bnet.cn:9080/*', // 上海电信，广东惠州电信
  'http://dkgl.zjhcsoft.com.cn/*', // 浙江台州电信，浙江温州电信，浙江宁波电信
  'https://114.221.126.216:9090/*', // 江苏苏州电信，江苏扬州电信
  'http://dde.crm.bmcc.com.cn/*', // 北京移动
]

// 显示全量爬取按钮的域名
export const showFullCrawlBtnHostnames: string[] = [
  'dkgl.bnet.cn', // 上海
  'dkgl.zjhcsoft.com.cn', // 浙江
]

// 记录需要抓取的通道号接口，不需要的不抓取
export const channelNumberReqUrls: string[] = [
  '/pdtc/pportInfo/datagrid.action', // 上海
  '/zjpdtc/pportInfo/datagrid.action', // 浙江
]

// 记录需要抓取的子端口接口，不需要的不抓取
export const subportReqUrls: string[] = [
  '/o/sms/customerSubportReport/page', // 测试
  '/pdtc/cportInfo/datagrid.action', // 上海
  '/zjpdtc/cportInfo/datagrid.action', // 浙江
  '/api/biz/port/subportUnreported/list', // 江苏
]

// 记录需要抓取的引流接口，不需要的不抓取
export const drainageReqUrls: string[] = [
  '/zjpdtc/ylurlConfig/datagrid.action', // 浙江
  '/api/biz/port/drainageInfo/list', // 江苏
]
