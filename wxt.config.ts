import { defineConfig } from 'wxt'
import { host_permissions } from './utils/config'

// See https://wxt.dev/api/config.html
export default defineConfig({
  // extensionApi: 'chrome',  // extensionApi 用于指定插件使用的浏览器API
  modules: ['@wxt-dev/module-vue'], // modules 用于指定插件使用的模块
  manifest: {
    name: '网站接口数据爬取工具',
    version: '3.0.0',
    description: '自动分页爬取管理后台接口数据并导出Excel',
    permissions: ['activeTab', 'storage', 'scripting'], // permissions 用于指定插件允许访问的权限
    host_permissions, // host_permissions 用于指定插件允许访问的网站
    web_accessible_resources: [
      // web_accessible_resources 用于注入 injected.js 到指定网站
      {
        resources: ['injected.js'],
        matches: host_permissions,
      },
    ],
  },
})
