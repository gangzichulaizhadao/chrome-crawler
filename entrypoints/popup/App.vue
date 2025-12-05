<template>
  <div class="popup-container">
    <h1>🕷️ 自动分页爬取工具</h1>

    <div class="info-box">
      <h3>使用说明：</h3>
      <ul>
        <li>点击页面右下角的悬浮球打开工具面板</li>
        <li>在网站上手动查询一次，让插件捕获接口</li>
        <li>选择要爬取的接口并配置参数</li>
        <li>点击"开始自动爬取"</li>
        <li>完成后点击"导出Excel"保存数据</li>
      </ul>
    </div>

    <div class="features">
      <h3>功能特点：</h3>
      <ul>
        <li>✅ 自动识别分页参数</li>
        <li>✅ 支持GET和POST请求</li>
        <li>✅ 自动循环爬取所有页</li>
        <li>✅ 一键导出Excel表格</li>
        <li>✅ 完整携带请求头和认证信息</li>
      </ul>
    </div>

    <div class="footer">
      <p>版本: 3.0.0 | WXT + Vue 3</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Popup页面的Vue组件
</script>

<style scoped>
.popup-container {
  width: 320px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

h1 {
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
}

.info-box,
.features {
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 13px;
  line-height: 1.6;
}

h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

li {
  margin-bottom: 5px;
  padding-left: 15px;
  position: relative;
}

li:before {
  content: '▸';
  position: absolute;
  left: 0;
}

.footer {
  text-align: center;
  font-size: 12px;
  opacity: 0.8;
}
</style>

