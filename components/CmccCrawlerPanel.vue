<template>
  <div>
    <!-- 悬浮球 -->
    <div
      v-show="!showPanel"
      ref="floatingButton"
      class="crawler-floating-button cmcc-theme"
      @click="handleFloatingButtonClick"
      @mousedown="startDrag"
      title="点击打开数据爬取工具"
    >
      🕷️
    </div>

    <!-- 主面板 -->
    <teleport to="body">
      <div v-show="showPanel" ref="panel" class="crawler-floating-panel cmcc-theme">
        <!-- 标题栏 -->
        <div class="crawler-panel-header cmcc-theme" @mousedown="startDrag">
          <span class="crawler-panel-title">移动自动分页爬取工具</span>
          <button class="crawler-close-btn" @click="showPanel = false">×</button>
        </div>

        <div class="crawler-panel-body">
          <!-- 使用说明 -->
          <div class="crawler-info-box cmcc-theme">
            <strong>📌 使用说明：</strong>
            <p>1. 在网站上手动查询一次（如：查看用户列表第1页）</p>
            <p>2. 在下方列表选择要爬取的接口</p>
            <p>3. 设置爬取页数</p>
            <p>4. 点击"开始自动爬取"</p>
            <p>5. 等待爬取完成后导出</p>
          </div>

          <!-- 最近的接口列表 -->
          <div class="crawler-section">
            <h3>最近的分页接口：</h3>
            <div class="crawler-request-list">
              <div v-if="capturedRequests.length === 0" class="crawler-empty">
                等待捕获接口...
              </div>
              <div
                v-for="(req, index) in capturedRequests.slice(0, 10)"
                :key="index"
                class="crawler-request-item"
              >
                <input
                  type="radio"
                  name="selected-request"
                  :value="index"
                  v-model="selectedRequestIndex"
                />
                <div class="crawler-request-info">
                  <div class="crawler-request-method cmcc-theme">{{ req.method }}</div>
                  <div class="crawler-request-url" :title="req.url">
                    {{ getShortUrl(req.url) }}
                  </div>
                  <div class="crawler-request-time">
                    {{ formatTime(req.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 爬取配置 -->
          <div class="crawler-section">
            <h3>爬取配置：</h3>
            <div class="crawler-form-group">
              <label>起始页码-结束页码（结束页码为0表示爬取到最后一页）：</label>
              <input
                style="width: 150px;"
                type="number"
                v-model.number="crawlerConfig.startPage"
                min="1"
              />
              <span style="margin: 0 10px;">-</span>
              <input
                style="width: 150px;"
                type="number"
                v-model.number="crawlerConfig.endPage"
                min="0"
              />
            </div>
            <div class="crawler-form-group">
              <label>最小间隔-最大间隔（分页间隔随机时间（秒））：</label>
              <input
                style="width: 150px;"
                type="number"
                v-model.number="crawlerConfig.minInterval"
                min="1"
                step="1"
              />
              <span style="margin: 0 10px;">-</span>
              <input
                style="width: 150px;"
                type="number"
                v-model.number="crawlerConfig.maxInterval"
                min="1"
                step="1"
              />
            </div>
          </div>

          <!-- 状态显示 -->
          <div v-if="isAllCrawling" class="crawler-status cmcc-theme">
            <div>正在全量爬取数据，请勿操作!</div>
            <div>共收集 : <span class="highlight cmcc-theme"> {{ dataCount }}</span> 条数据</div>
            <ul>
              <li v-for="item in channelNumberList">
                {{ item.accessno }} : 已收集 <span class="highlight cmcc-theme"> {{ channelObj[item.accessno]?.length || 0 }}</span> 条数据
              </li>
            </ul>
          </div>
          <div v-else class="crawler-status cmcc-theme">
            状态: {{ statusText }} | 已收集: <span class="highlight cmcc-theme">{{ dataCount }}</span> 条数据
          </div>

          <!-- 按钮组 -->
          <div class="crawler-button-group">
            <!-- 开始/暂停/继续 按钮 (共用一个位置) -->
            <button
              v-if="!isAutoCrawling && !isPaused"
              class="crawler-btn crawler-btn-primary cmcc-theme"
              @click="startAutoCrawl"
            >
              ▶️ 开始爬取
            </button>
            <button
              v-else-if="isAutoCrawling && !isPaused"
              class="crawler-btn crawler-btn-warning cmcc-theme"
              @click="pauseCrawl"
            >
              ⏸️ 暂停爬取
            </button>
            <button
              v-else-if="isPaused"
              class="crawler-btn crawler-btn-primary cmcc-theme"
              @click="startAutoCrawl"
            >
              ▶️ 继续爬取
            </button>
            
            <!-- 停止按钮 -->
            <button
              class="crawler-btn crawler-btn-danger cmcc-theme"
              @click="stopCrawl"
              :disabled="!isAutoCrawling && !isPaused"
            >
              ⏹️ 停止爬取
            </button>
            
            <!-- 导出Excel -->
            <button 
              class="crawler-btn crawler-btn-success cmcc-theme" 
              @click="exportToExcel"
              :disabled="allCrawledData.length === 0"
            >
              📊 导出Excel
            </button>
            
            <!-- 清空数据 -->
            <button 
              class="crawler-btn crawler-btn-clear cmcc-theme" 
              @click="clearData"
              :disabled="allCrawledData.length === 0 || isAutoCrawling"
            >
              🗑️ 清空数据
            </button>
            <!-- 全量爬取 -->
            <button 
              :disabled="isAllCrawling"
              class="crawler-btn crawler-btn-clear cmcc-theme"
              @click="allCrawl"
            >
              全量爬取
            </button>
          </div>

          <!-- 数据预览 -->
          <div class="crawler-preview cmcc-theme">
            <div class="crawler-preview-title">数据预览（最新10条）：</div>
            <div class="crawler-preview-content">
              <pre v-if="allCrawledData.length > 0">{{
                JSON.stringify(allCrawledData.slice(-10), null, 2)
              }}</pre>
              <div v-else class="text-muted">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCrawler } from '~/composables/CmccuseCrawler';

const showPanel = ref(false);
const floatingButton = ref<HTMLElement>();
const panel = ref<HTMLElement>();

// 使用爬取组合式函数
const {
  capturedRequests,
  channelNumberList,
  channelObj,
  allCrawledData,
  isAllCrawling,
  isAutoCrawling,
  isPaused,
  currentPage,
  selectedRequestIndex,
  crawlerConfig,
  dataCount,
  statusText,
  startAutoCrawl,
  pauseCrawl,
  stopCrawl,
  exportToExcel,
  clearData,
  allCrawl
} = useCrawler();

// 拖动相关
let isDragging = false;
let hasDragged = false; // 记录是否发生了拖动
let currentElement: HTMLElement | null = null;
let offsetX = 0;
let offsetY = 0;
let startX = 0; // 记录起始X坐标
let startY = 0; // 记录起始Y坐标

function startDrag(e: MouseEvent) {
  isDragging = true;
  hasDragged = false; // 重置拖动标记
  startX = e.clientX; // 记录起始位置
  startY = e.clientY;
  currentElement = (e.currentTarget as HTMLElement).closest(
    '.crawler-floating-panel, .crawler-floating-button'
  ) as HTMLElement;

  if (currentElement) {
    const rect = currentElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }

  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging || !currentElement) return;

  // 计算移动距离
  const deltaX = Math.abs(e.clientX - startX);
  const deltaY = Math.abs(e.clientY - startY);
  
  // 只有移动超过5px才算拖动
  if (deltaX > 5 || deltaY > 5) {
    hasDragged = true; // 标记为已拖动
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    currentElement.style.left = `${x}px`;
    currentElement.style.top = `${y}px`;
    currentElement.style.transform = 'none';
  }
}

function onMouseUp() {
  isDragging = false;
  currentElement = null;
}

// 悬浮球点击事件
function handleFloatingButtonClick() {
  // 如果刚刚拖动过，不触发点击
  if (hasDragged) {
    hasDragged = false;
    return;
  }
  showPanel.value = true;
}

// 工具函数
function getShortUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname + urlObj.search;
  } catch (e) {
    return url;
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>

<style scoped>
.cmcc-theme.crawler-floating-button {
  background: linear-gradient(135deg, #1E90FF 0%, #0066CC 100%) !important;
}

.cmcc-theme.crawler-panel-header {
  background: linear-gradient(135deg, #1E90FF 0%, #0066CC 100%) !important;
}

.cmcc-theme.crawler-info-box {
  background: #F0F8FF !important;
  border-left: 4px solid #1E90FF !important;
}

.cmcc-theme.crawler-info-box strong {
  color: #0066CC !important;
}

.cmcc-theme.crawler-request-method {
  background: #1E90FF !important;
}

.cmcc-theme.crawler-status {
  background: #F0F8FF !important;
}

.cmcc-theme.highlight {
  color: #0066CC !important;
}

.cmcc-theme.crawler-btn-primary {
  background: linear-gradient(135deg, #1E90FF 0%, #0066CC 100%) !important;
}

.cmcc-theme.crawler-btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4) !important;
}

.cmcc-theme.crawler-btn-danger {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%) !important;
}

.cmcc-theme.crawler-btn-danger:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4) !important;
}

.cmcc-theme.crawler-btn-success {
  background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%) !important;
}

.cmcc-theme.crawler-btn-success:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4) !important;
}

.cmcc-theme.crawler-btn-warning {
  background: linear-gradient(135deg, #FFD93D 0%, #FF9A3D 100%) !important;
}

.cmcc-theme.crawler-btn-warning:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(255, 217, 61, 0.4) !important;
}

.cmcc-theme.crawler-btn-clear {
  background: linear-gradient(135deg, #D3D3D3 0%, #A9A9A9 100%) !important;
}

.cmcc-theme.crawler-btn-clear:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(169, 169, 169, 0.4) !important;
}

.cmcc-theme.crawler-preview {
  background: #F0F8FF !important;
}

.cmcc-theme.crawler-form-group input[type='number']:focus {
  border-color: #1E90FF !important;
}
</style>

