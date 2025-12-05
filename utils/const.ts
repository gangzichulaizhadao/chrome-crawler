// 用户对应的运营商
export const userNameMap: Record<string, string> = {
  admin: '测试',
  'BJYM@SH': '上海电信',
  kabang: '广东惠州电信',
  'SP_BJYM@TZ': '浙江台州电信',
  'SP_FJYT@WZ': '浙江温州电信',
  // '待定': '浙江宁波',
  '10682512': '江苏苏州电信',
  '10691960': '江苏扬州电信',
}

// 江苏区号对应地市
export const jingsu_AreaCodeMap: Record<string, string> = {
  '0519': '常州',
  '0517': '淮安',
  '0518': '连云港',
  '025': '南京',
  '0513': '南通',
  '0512': '苏州',
  '0527': '宿迁',
  '0523': '泰州',
  '0510': '无锡',
  '0516': '徐州',
  '0515': '盐城',
  '0514': '扬州',
  '0511': '镇江',
}

// 江苏子端口导出文件字段映射
export const jiangsu_subport_exportFileKeyMap: Record<string, string> = {
  a: '信息报送单位',
  mainportNum: '局数据端口', // 通道号
  b: '服务号',
  c: '扩展码',
  d: '服务号+扩展码', // subportNum去掉mainportNum部分
  e: '接入省', // 江苏省
  areaCode: '接入地市',
  subportNum: '真实发送端口号', // 全码
  orgName: '真实发送端口号的单位名称',
  orgCode: '真实发送端口号的单位证件号码（统一社会信用代码）',
  subportSign: '企业签名',
  f: '责任人（含法人）姓名',
  g: '责任人（含法人）证件号码',
  h: '经办人姓名',
  i: '经办人证件号码',
  authBeginTime: '授权开始时间',
  authEndTime: '授权到期时间',
  j: '归属销售工号',
  status: '报备状态',
  k: '失败原因',
}

// 上海子端口导出文件字段映射
export const shanghai_subport_exportFileKeyMap: Record<string, string> = {
  a: '信息报送单位',
  pport: '局数据端口', // 通道号
  b: '服务号',
  c: '扩展码',
  d: '服务号+扩展码', // cport去掉pport部分
  e: '接入省', // 上海
  f: '接入地市',
  cport: '真实发送端口号', // 全码
  sjsykhmc: '真实发送端口号的单位名称',
  qytyshxydm: '真实发送端口号的单位证件号码（统一社会信用代码）',
  cportqm: '企业签名',
  sjsykhjbr: '责任人（含法人）姓名',
  g: '责任人（含法人）证件号码',
  zrrhfr: '经办人姓名',
  h: '经办人证件号码',
  beginTime: '授权开始时间',
  endtime: '授权到期时间',
  i: '归属销售工号',
  j: '报备状态',
  k: '失败原因',
}

// 江苏引流导出文件字段映射
export const jiangsu_drainage_exportFileKeyMap: Record<string, string> = {
  a: '报备状态',
  b: '公司名称',
  c: '服务号',
  d: '消息类型',
  e: '运营商', // 电信CTCC
  f: '引流签名报备状态',
  g: '通道名',
  mainportNum: '通道号',
  h: '引流编码', // subportNum去掉mainportNum部分
  subportNum: '报备端口号', // 全码
  subportSign: '签名',
  subportOrgName: '签名归属公司',
  linkUrl1: '引流链接',
  i: '原始链接',
  drainageNum1: '电话1',
  drainageNum2: '电话2',
  provName: '省份',
  areaCode: '地区/市',
  j: '模板',
  updateTime: '更新时间',
  k: '归属销售',
  l: '报备人',
  m: '失败原因',
}

// 浙江引流导出文件字段映射
export const zhejiang_drainage_exportFileKeyMap: Record<string, string> = {
  a: '报备状态',
  createusername: '公司名称',
  b: '服务号',
  c: '消息类型',
  d: '运营商', // 电信CTCC
  e: '引流签名报备状态',
  f: '通道名',
  pport: '通道号',
  g: '引流编码', // cport去掉pport部分
  cport: '报备端口号', // 全码
  h: '签名',
  spname: '签名归属公司',
  url1: '引流链接',
  i: '原始链接',
  phone1: '电话1',
  phone2: '电话2',
  provicename: '省份',
  cityname: '地区/市',
  j: '模板',
  k: '更新时间',
  l: '归属销售',
  m: '报备人',
  n: '失败原因',
}

// 北京子端口导出文件字段映射
export const beijing_exportFileKeyMap: Record<string, string> = {
  submitUnit: '信息报送单位',
  mainPortNum: '局数据端口', // 通道号
  b: '服务号',
  c: '扩展码',
  d: '服务号+扩展码', //10692118089966 - 10692118
   // cport去掉pport部分
  sencondPortNum: '真实发送端口号', // 全码
  portUnitName_no: '真实发送端口号的单位名称',

  accessProvince: '接入省', // 上海
  accessCity: '接入地市',
  uscu_no: '真实发送端口号的单位证件号码（统一社会信用代码）',
  corpSign: '企业签名',
  responsibleName_no: '责任人（含法人）姓名',
  responsibleIdNo_no: '责任人（含法人）证件号码',
  agentName_no: '经办人姓名',
  agentIdNo_no: '经办人证件号码',
  startTime: '授权开始时间',
  expirationTime: '授权到期时间',
  i: '归属销售工号',
  auditStatus: '报备状态',
  reasonForRejection: '失败原因',
}
