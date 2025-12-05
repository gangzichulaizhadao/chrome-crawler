import { createApp } from 'vue'
import CTCCPanel from '@/components/CTCCPanel/index.vue'
import CmccCrawlerPanel from '~/components/CmccCrawlerPanel.vue'
import '~/assets/content.css'

export default defineContentScript({
  matches: host_permissions,
  runAt: 'document_end',
  async main() {
    console.log('🕷️ Content script loaded')

    // 注入 injected script
    injectScript('/injected.js')

    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 创建容器
    const container = document.createElement('div')
    container.id = 'crawler-extension-root'
    document.body.appendChild(container)

    // 根据域名选择挂载的组件
    const currentDomain = window.location.hostname
    let componentToMount
    
    if (currentDomain === 'dde.crm.bmcc.com.cn' || currentDomain === '172.16.11.210') {
      console.log('检测到移动域名，挂载CmccCrawlerPanel')
      componentToMount = CmccCrawlerPanel
    } else {
      console.log('检测到其他域名，挂载CrawlerPanel')
      componentToMount = CTCCPanel
    }

    // 挂载 Vue 应用
    createApp(componentToMount).mount(container)
  },
})
