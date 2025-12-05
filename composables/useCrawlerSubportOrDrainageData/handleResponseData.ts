const domain: Record<string, Function> = {
  '172.16.11.210': ceshi, // 测试
  'dkgl.bnet.cn': shanghai, // 上海，广东惠州
  'dkgl.zjhcsoft.com.cn': zhejiang, // 浙江台州，浙江温州，浙江宁波
  '114.221.126.216': jiangsu, // 江苏苏州，江苏扬州
}

export function handleResponseData(result: any): any[] {
  const hostname = window.location.hostname
  return domain[hostname] ? domain[hostname](result) : result
}

function ceshi(result: any): any[] {
  return result.response.result.list
}

function shanghai(result: any): any[] {
  return result.response.obj
}

function zhejiang(result: any): any[] {
  return shanghai(result)
}

function jiangsu(result: any): any[] {
  return result.response.data.records
}
