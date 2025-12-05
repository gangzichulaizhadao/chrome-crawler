<template>
  <div>
    <!-- 悬浮球 -->
    <div
      v-show="!showPanel"
      class="crawler-floating-button"
      @click="handleFloatingButtonClick"
      @mousedown="startDrag"
      title="点击打开数据爬取工具"
    >
      🕷️
    </div>

    <!-- 主面板 -->
    <teleport to="body">
      <div v-show="showPanel" class="crawler-floating-panel">
        <!-- 标题栏 -->
        <div class="crawler-panel-header" @mousedown="startDrag">
          <span class="crawler-panel-title">🕷️ {{ carrierName }} - 自动分页爬取工具</span>
          <button class="crawler-close-btn" @click="showPanel = false">×</button>
        </div>

        <!-- Tab 导航 -->
        <div class="crawler-tab-nav">
          <span class="crawler-tab-item" :class="{ active: tabType === 'subport' }" @click="tabType = 'subport'">
            <span class="tab-icon">📡</span>
            <span class="tab-text">子端口</span>
          </span>
          <span class="crawler-tab-item" :class="{ active: tabType === 'drainage' }" @click="tabType = 'drainage'">
            <span class="tab-icon">🌊</span>
            <span class="tab-text">引流</span>
          </span>
        </div>
        <!-- 子端口、引流 -->
        <keep-alive>
          <component :is="tabType === 'subport' ? Subport : Drainage" />
        </keep-alive>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Drainage from './Drainage.vue'
import Subport from './Subport.vue'

const tabType = ref('subport')
const showPanel = ref(false)
const carrierName = ref('')

// 获取运营商名称
async function getCarrierName() {
  const result = await chrome.storage.local.get('USER_NAME')
  carrierName.value = userNameMap[result?.USER_NAME] || ''
}

// 拖动相关
let isDragging = false
let hasDragged = false // 记录是否发生了拖动
let currentElement: HTMLElement | null = null
let offsetX = 0
let offsetY = 0
let startX = 0 // 记录起始X坐标
let startY = 0 // 记录起始Y坐标

function startDrag(e: MouseEvent) {
  isDragging = true
  hasDragged = false // 重置拖动标记
  startX = e.clientX // 记录起始位置
  startY = e.clientY
  currentElement = (e.currentTarget as HTMLElement).closest(
    '.crawler-floating-panel, .crawler-floating-button'
  ) as HTMLElement

  if (currentElement) {
    const rect = currentElement.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top
  }

  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging || !currentElement) return

  // 计算移动距离
  const deltaX = Math.abs(e.clientX - startX)
  const deltaY = Math.abs(e.clientY - startY)

  // 只有移动超过5px才算拖动
  if (deltaX > 5 || deltaY > 5) {
    hasDragged = true // 标记为已拖动
    const x = e.clientX - offsetX
    const y = e.clientY - offsetY

    currentElement.style.left = `${x}px`
    currentElement.style.top = `${y}px`
    currentElement.style.transform = 'none'
  }
}

function onMouseUp() {
  isDragging = false
  currentElement = null
}

// 悬浮球点击事件
function handleFloatingButtonClick() {
  // 如果刚刚拖动过，不触发点击
  if (hasDragged) {
    hasDragged = false
    return
  }
  showPanel.value = true
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  getCarrierName()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
/* Tab 导航样式 */
.crawler-tab-nav {
  display: flex;
  gap: 8px;
  padding: 16px 20px 0;
  background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 2px solid #e9ecef;
}

.crawler-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  background: transparent;
  border: 2px solid transparent;
  border-bottom: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 100px;
  justify-content: center;
}

/* Tab 图标 */
.tab-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.tab-text {
  transition: color 0.3s ease;
}

/* 悬停效果 */
.crawler-tab-item:hover {
  color: #495057;
  background: rgba(13, 110, 253, 0.05);
  transform: translateY(-2px);
}

.crawler-tab-item:hover .tab-icon {
  transform: scale(1.1);
}

/* 激活状态 */
.crawler-tab-item.active {
  color: #0d6efd;
  background: #ffffff;
  border-color: #e9ecef;
  border-bottom-color: transparent;
  font-weight: 600;
  box-shadow: 0 -2px 8px rgba(13, 110, 253, 0.1), 0 2px 0 0 #ffffff;
  z-index: 1;
}

.crawler-tab-item.active .tab-icon {
  transform: scale(1.15);
  filter: drop-shadow(0 2px 4px rgba(13, 110, 253, 0.2));
}

/* 激活状态下的底部指示器 */
.crawler-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0d6efd 0%, #0a58ca 100%);
  border-radius: 3px 3px 0 0;
}

/* 点击动画 */
.crawler-tab-item:active {
  transform: translateY(0);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .crawler-tab-nav {
    gap: 4px;
    padding: 12px 15px 0;
  }

  .crawler-tab-item {
    padding: 8px 15px;
    min-width: 80px;
    font-size: 13px;
  }

  .tab-icon {
    font-size: 14px;
  }
}
</style>
