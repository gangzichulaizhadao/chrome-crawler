import {
  userNameMap,
  jingsu_AreaCodeMap,
  jiangsu_subport_exportFileKeyMap,
  shanghai_subport_exportFileKeyMap,
  jiangsu_drainage_exportFileKeyMap,
  zhejiang_drainage_exportFileKeyMap,
} from '@/utils/const'
import { ExportType, ExportTypeEnum } from '@/types'

const domain: Record<string, Function> = {
  '172.16.11.210': ceshi, // 测试
  'dkgl.bnet.cn': shanghai, // 上海，广东惠州
  'dkgl.zjhcsoft.com.cn': zhejiang, // 浙江台州，浙江温州，浙江宁波
  '114.221.126.216': jiangsu, // 江苏苏州，江苏扬州
}

export async function handleExportData(allCrawledData: any[], exportType: ExportType) {
  const hostname = window.location.hostname
  const exportData = domain[hostname] ? domain[hostname](allCrawledData, exportType) : allCrawledData

  const result = await chrome.storage.local.get('USER_NAME')
  let carrierName = userNameMap[result?.USER_NAME] || ''

  return {
    exportData,
    carrierName,
  }
}

function ceshi(allCrawledData: any[]) {
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

function zhejiang(allCrawledData: any[], exportType: ExportType) {
  return allCrawledData.map((item) => {
    // 处理item
    if (exportType === ExportTypeEnum.DRAINAGE) {
      item.d = 'CTCC'
      item.g = item.cport.replace(item.pport, '')
    } else if (exportType === ExportTypeEnum.SUBPORT) {
      item.a = '亿美软通科技有限公司'
      item.d = item.cport.replace(item.pport, '')
      item.e = '浙江省'
      item.j = '报备成功'
    }

    const keyMap =
      exportType === ExportTypeEnum.DRAINAGE ? zhejiang_drainage_exportFileKeyMap : shanghai_subport_exportFileKeyMap

    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in keyMap) {
      newObj[keyMap[key]] = item[key] || ''
    }
    return newObj
  })
}

// 江苏苏州 子端口
function jiangsu(allCrawledData: any[], exportType: ExportType) {
  return allCrawledData.map((item) => {
    // 处理item
    if (exportType === ExportTypeEnum.DRAINAGE) {
      item.b = '亿美软通科技有限公司'
      item.e = 'CTCC'
      item.h = item.subportNum.replace(item.mainportNum, '')
      item.areaCode = jingsu_AreaCodeMap[item.areaCode] || ''
    } else if (exportType === ExportTypeEnum.SUBPORT) {
      item.a = '亿美软通科技有限公司'
      item.d = item.subportNum.replace(item.mainportNum, '')
      item.e = '江苏省'
      item.status = item.status === 4 ? '报备失败' : item.status === 3 ? '已报备' : item.status
      item.areaCode = jingsu_AreaCodeMap[item.areaCode] || ''
    }

    const keyMap =
      exportType === ExportTypeEnum.DRAINAGE ? jiangsu_drainage_exportFileKeyMap : jiangsu_subport_exportFileKeyMap

    // 处理导出文件字段
    const newObj: Record<string, string> = {}
    for (const key in keyMap) {
      newObj[keyMap[key]] = item[key] || ''
    }
    return newObj
  })
}
