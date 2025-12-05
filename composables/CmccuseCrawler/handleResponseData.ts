const domain: Record<string, Function> = {
  '172.16.11.210': ceshi, // 测试
  'dkgl.bnet.cn': shanghaiOrGuangdong, // 上海电信，广东惠州电信
  'dkgl.zjhcsoft.com.cn': zhejiang, // 浙江台州电信，浙江温州电信，浙江宁波电信
  '114.221.126.216': jiangsu, // 江苏苏州电信，江苏扬州电信
  'dde.crm.bmcc.com.cn': beijing, // 北京移动
}

export function handleResponseData(result: any): any[] {
  const hostname = window.location.hostname
  return domain[hostname] ? domain[hostname](result) : result
}

function ceshi(result: any): any[] {
  return result.response.result.list
}

function shanghaiOrGuangdong(result: any): any[] {
  return result.response.obj
}

function zhejiang(result: any): any[] {
  return shanghaiOrGuangdong(result)
}

function jiangsu(result: any): any[] {
  return result.response.data.records
}


function beijing(result: any): any[] {
  return jiangsu(result)
}
