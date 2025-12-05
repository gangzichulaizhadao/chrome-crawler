import { jingsu_AreaCodeMap, jiangsu_subport_exportFileKeyMap, shanghai_subport_exportFileKeyMap,beijing_exportFileKeyMap } from '~/utils/const'

const userNameMap: Record<string, string> = {
  admin: '测试',
  'BJYM@SH': '上海电信',
  kabang: '广东惠州',
  'SP_BJYM@TZ': '浙江台州',
  'SP_FJYT@WZ': '浙江温州',
  // '待定': '浙江宁波',
  '10682512': '江苏苏州',
  yangruyan: '江苏电信',
  '10691960': '江苏扬州',
}

const domain: Record<string, Function> = {
  '172.16.11.210': ceshi, // 测试
  'dkgl.bnet.cn': shanghai, // 上海电信，广东惠州电信
  'dkgl.zjhcsoft.com.cn': zhejiang, // 浙江台州电信，浙江温州电信，浙江宁波电信
  '114.221.126.216': jiangsu, // 江苏苏州电信，江苏扬州电信
  'dde.crm.bmcc.com.cn': beijing, // 北京移动
}

export function handleExportData(allCrawledData: any[], userName: string) {
  const hostname = window.location.hostname
  const exportData = domain[hostname] ? domain[hostname](allCrawledData) : allCrawledData
  // 获取name，如果userNameMap中没有，则从页面中获取
  let fileName = ''
  if (userName) {
    fileName = userNameMap[userName] || ''
  } else {
    fileName = '北京移动实名报备'
    // console.log('没有userName')
    // let name = ''
    // const userNameElement = document.querySelector('.ivu-dropdown-rel .user-name')
    // if (userNameElement) {
    //   name = (userNameElement as HTMLElement).innerText || ''
    // }
    // const userNameElement1 = document.querySelector('.avatar-container .el-dropdown-link')
    // if (userNameElement1) {
    //   name = (userNameElement1 as HTMLElement).childNodes[0].nodeValue?.trim() || ''
    //   name = name.split('，')[1] || ''
    // }
    // console.log('🚀 ~ handleExportData ~ name:', name)
    // fileName = userNameMap[name] || ''
  }

  return {
    exportData,
    name: fileName,
  }
}

function ceshi(allCrawledData: any[]) {
  console.log('🚀 ~ ceshi ~ allCrawledData:', allCrawledData)
  return allCrawledData
}

function shanghai(allCrawledData: any[]) {
  return allCrawledData.map((item) => {
    // 处理item
    item.a = '亿美软通科技有限公司'
    item.d = item.cport.replace(item.pport, '')
    item.e = '上海市'
    item.j = '报备成功'

    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in shanghai_subport_exportFileKeyMap) {
      newObj[shanghai_subport_exportFileKeyMap[key]] = item[key] || ''
    }
    return newObj
  })
}

function zhejiang(allCrawledData: any[]) {
  return allCrawledData.map((item) => {
    // 处理item
    item.a = '亿美软通科技有限公司'
    item.d = item.cport.replace(item.pport, '')
    item.e = '浙江省'
    item.j = '报备成功'

    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in shanghai_subport_exportFileKeyMap) {
      newObj[shanghai_subport_exportFileKeyMap[key]] = item[key] || ''
    }
    return newObj
  })
}

// 江苏苏州 子端口
function jiangsu(allCrawledData: any[]) {
  return allCrawledData.map((item) => {
    // 处理item
    item.a = '亿美软通科技有限公司'
    item.d = item.subportNum.replace(item.mainportNum, '')
    item.e = '江苏省'
    item.status = item.status === 4 ? '报备失败' : item.status === 3 ? '已报备' : item.status
    item.areaCode = jingsu_AreaCodeMap[item.areaCode] || ''

    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in jiangsu_subport_exportFileKeyMap) {
      newObj[jiangsu_subport_exportFileKeyMap[key]] = item[key] || ''
    }
    return newObj
  })
}

// 北京移动 子端口
function beijing(allCrawledData: any[]) {
  return allCrawledData.map((item) => {
    // 处理item
    item.d = item.sencondPortNum.replace(item.mainPortNum, '')
    item.auditStatus = Number(item.auditStatus) ===  2 ? '报备失败' :  Number(item.auditStatus)? '报备成功' : item.auditStatus
    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in beijing_exportFileKeyMap) {
      newObj[beijing_exportFileKeyMap[key]] = item[key] || ''
    }
    return newObj
  })
}
