<template>
  <div class="crawler-panel-body">
    <!-- 抓取的通道号接口：只有开启全量爬取的时候才显示 -->
    <div v-if="isAllCrawlingRef" class="crawler-section">
      <h3>抓取的通道号接口：</h3>
      <div class="crawler-request-list">
        <div v-if="capturedChannelNumberRequests.length === 0" class="crawler-empty">等待捕获接口...</div>
        <div
          v-for="(req, index) in capturedChannelNumberRequests.slice(0, 10)"
          :key="index"
          class="crawler-request-item"
        >
          <div class="crawler-request-info">
            <div class="crawler-request-method">{{ req.method }}</div>
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
    <!-- 抓取的子端口接口 -->
    <div class="crawler-section">
      <h3>抓取的子端口接口：</h3>
      <div class="crawler-request-list">
        <div v-if="capturedRequests.length === 0" class="crawler-empty">等待捕获接口...</div>
        <div v-for="(req, index) in capturedRequests.slice(0, 10)" :key="index" class="crawler-request-item">
          <div class="crawler-request-info">
            <div class="crawler-request-method">{{ req.method }}</div>
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
    <div v-if="!isAllCrawlingRef" class="crawler-section">
      <h3>爬取配置：</h3>
      <div class="crawler-form-group">
        <label>起始页码-结束页码（结束页码为0表示爬取到最后一页）：</label>
        <input style="width: 150px" type="number" v-model.number="crawlerConfig.startPage" min="1" />
        <span style="margin: 0 10px">-</span>
        <input style="width: 150px" type="number" v-model.number="crawlerConfig.endPage" min="0" />
      </div>
      <div class="crawler-form-group">
        <label>最小间隔-最大间隔（分页间隔随机时间（秒））：</label>
        <input
          style="width: 150px"
          type="number"
          v-model.number="crawlerConfig.minInterval"
          min="1"
          step="1"
          disabled
        />
        <span style="margin: 0 10px">-</span>
        <input
          style="width: 150px"
          type="number"
          v-model.number="crawlerConfig.maxInterval"
          min="1"
          step="1"
          disabled
        />
      </div>
    </div>

    <!-- 状态显示 -->
    <div>
      <!-- 全量爬取 -->
      <div v-if="isAllCrawlingRef" class="crawler-status">
        <div v-html="subportStatusText"></div>
        <div v-if="!isCrawlingChannelNumber && channelNumberList.length > 0" class="channel-table-wrapper">
          <div class="channel-table-scroll-container">
            <table class="channel-table">
              <thead>
                <tr>
                  <th class="th-checkbox">选择</th>
                  <th class="th-index">序号</th>
                  <th class="th-channel">通道号</th>
                  <th class="th-page">起始页</th>
                  <th class="th-page">结束页</th>
                  <th v-if="isShowCrawingStatus" class="th-stats">当前爬取页码</th>
                  <th v-if="isShowCrawingStatus" class="th-stats">已收集数据</th>
                  <th v-if="isShowCrawingStatus" class="th-stats">爬取状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in channelNumberList"
                  :key="item.accessno"
                  class="channel-row"
                  :class="{ 'row-checked': channelObj[item.accessno]?.isChecked }"
                >
                  <td class="td-checkbox">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        :disabled="channelObj[item.accessno]?.disabled"
                        v-model="channelObj[item.accessno].isChecked"
                        class="checkbox-input"
                      />
                      <span class="checkbox-mark"></span>
                    </label>
                  </td>
                  <td class="td-index">{{ channelObj[item.accessno].id }}</td>
                  <td class="td-channel">
                    {{ item.accessno }}
                  </td>
                  <td class="td-page">
                    <input
                      class="page-input"
                      type="number"
                      :disabled="channelObj[item.accessno].disabled"
                      v-model.number="channelObj[item.accessno].startPage"
                      min="1"
                      step="1"
                    />
                  </td>
                  <td class="td-page">
                    <input
                      class="page-input"
                      type="number"
                      :disabled="channelObj[item.accessno].disabled"
                      v-model.number="channelObj[item.accessno].endPage"
                      min="1"
                      step="1"
                    />
                  </td>
                  <td v-if="isShowCrawingStatus" class="td-stats">
                    <span class="stats-badge"> 第 {{ channelObj[item.accessno]?.currentPage }} 页 </span>
                  </td>
                  <td v-if="isShowCrawingStatus" class="td-stats">
                    <span class="stats-badge"> 共 {{ channelObj[item.accessno]?.list?.length || 0 }} 条 </span>
                  </td>
                  <td v-if="isShowCrawingStatus" class="td-stats">
                    <span class="stats-badge">
                      {{
                        channelObj[item.accessno].allCrawled
                          ? '爬取完成'
                          : !channelObj[item.accessno].allCrawled && channelObj[item.accessno]?.list?.length > 0
                          ? '爬取中'
                          : '待爬取'
                      }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else class="crawler-status">
        状态: {{ statusText }} | 已收集: <span class="highlight">{{ dataCount }}</span> 条数据
      </div>
    </div>

    <!-- 按钮组 -->
    <div class="crawler-button-group">
      <template v-if="isAllCrawlingRef">
        <!-- 开始爬取所有的通道号 -->
        <button
          class="crawler-btn crawler-btn-primary"
          :disabled="isCrawlingChannelNumber || isCrawlingSubportData"
          @click="() => ((isShowCrawingStatus = false), crawlAllChannelNumber())"
        >
          ▶️ 开始爬取所有的通道号
        </button>
        <!-- 根据通道号爬取子端口数据 -->
        <button
          v-if="!isCrawlingSubportData && !isPausedCrawleSubport"
          :disabled="isCrawlingChannelNumber"
          class="crawler-btn crawler-btn-clear"
          @click="() => ((isShowCrawingStatus = true), crawlAllDataByChannelNumber())"
        >
          根据通道号爬取子端口数据
        </button>
        <button
          v-else-if="isCrawlingSubportData && !isPausedCrawleSubport"
          @click="pauseCrawleSubport"
          class="crawler-btn crawler-btn-warning"
        >
          ⏸️ 暂停爬取
        </button>
        <button
          v-else-if="isPausedCrawleSubport"
          class="crawler-btn crawler-btn-primary"
          @click="crawlAllDataByChannelNumber"
        >
          ▶️ 继续爬取
        </button>

        <!-- 停止按钮 -->
        <button
          class="crawler-btn crawler-btn-danger"
          @click="() => ((isShowCrawingStatus = false), stopCrawleSubport())"
          :disabled="!isCrawlingSubportData && !isPausedCrawleSubport"
        >
          ⏹️ 停止爬取
        </button>
        <!-- 导出Excel -->
        <button
          class="crawler-btn crawler-btn-success"
          @click="exportSubportByChannelNumberExcel"
          :disabled="allCrawledSubportList.length === 0"
        >
          📊 导出Excel
        </button>
      </template>
      <template v-else>
        <!-- 开始/暂停/继续 按钮 (共用一个位置) -->
        <button v-if="!isAutoCrawling && !isPaused" class="crawler-btn crawler-btn-primary" @click="startAutoCrawl">
          ▶️ 开始爬取
        </button>
        <button v-else-if="isAutoCrawling && !isPaused" class="crawler-btn crawler-btn-warning" @click="pauseCrawl">
          ⏸️ 暂停爬取
        </button>
        <button v-else-if="isPaused" class="crawler-btn crawler-btn-primary" @click="startAutoCrawl">
          ▶️ 继续爬取
        </button>

        <!-- 停止按钮 -->
        <button class="crawler-btn crawler-btn-danger" @click="stopCrawl" :disabled="!isAutoCrawling && !isPaused">
          ⏹️ 停止爬取
        </button>
        <!-- 导出Excel -->
        <button
          class="crawler-btn crawler-btn-success"
          @click="exportSubportOrDrainageExcel"
          :disabled="allCrawledData.length === 0"
        >
          📊 导出Excel
        </button>

        <!-- 清空数据 -->
        <button
          class="crawler-btn crawler-btn-clear"
          @click="clearData"
          :disabled="allCrawledData.length === 0 || isAutoCrawling"
        >
          🗑️ 清空数据
        </button>
      </template>
    </div>

    <!-- siwtch开关，开启则根据选择的通道号全量爬取子端口数据 -->
    <div v-if="showFullCrawlBtn" class="crawler-section">
      <div class="crawler-toggle-container">
        <div class="crawler-toggle-label">
          <span class="toggle-icon">⚡</span>
          <div class="toggle-text">
            <h3>开启全量爬取</h3>
            <p class="toggle-description">根据选择的通道号全量爬取子端口数据</p>
          </div>
        </div>
        <label class="crawler-toggle-switch">
          <input type="checkbox" v-model="isAllCrawlingRef" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCrawlerByChannelNumber } from '@/composables/useCrawlerSubportOrDrainageData/useCrawlerByChannelNumber'
import { useCrawlerSubportOrDrainageData } from '@/composables/useCrawlerSubportOrDrainageData'
import { getShortUrl, formatTime } from '@/utils/utils'
import { subportReqUrls, showFullCrawlBtnHostnames } from '@/utils/config'
import { ExportTypeEnum } from '@/types'

defineOptions({ name: 'Subport' })

// 是否显示全量爬取按钮
const showFullCrawlBtn = computed(() => showFullCrawlBtnHostnames.includes(window.location.hostname))

// 是否开启全量爬取
const isAllCrawlingRef = ref(false)
// 是否显示全量爬取状态
const isShowCrawingStatus = ref(false)

// 使用爬取组合式函数
const {
  capturedRequests,

  allCrawledData,
  isAutoCrawling,
  isPaused,
  crawlerConfig,

  dataCount,
  statusText,

  startAutoCrawl,
  pauseCrawl,
  stopCrawl,
  exportSubportOrDrainageExcel,
  clearData,
} = useCrawlerSubportOrDrainageData({ reqUrls: subportReqUrls, exportType: ExportTypeEnum.SUBPORT })

const {
  capturedChannelNumberRequests,
  // 爬取通道号
  isCrawlingChannelNumber,
  channelNumberList,
  channelObj,
  // 爬取子端口
  isCrawlingSubportData,
  isPausedCrawleSubport,
  allCrawledSubportList,

  statusText: subportStatusText,

  crawlAllChannelNumber,
  crawlAllDataByChannelNumber,
  pauseCrawleSubport,
  stopCrawleSubport,
  exportSubportByChannelNumberExcel,
} = useCrawlerByChannelNumber()
</script>

<style scoped>
/* 开关容器 */
.crawler-toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.crawler-toggle-container:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

/* 标签区域 */
.crawler-toggle-label {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.toggle-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.toggle-text h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-description {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 400;
}

/* 开关按钮 */
.crawler-toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  flex-shrink: 0;
  cursor: pointer;
}

.crawler-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 32px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-slider:before {
  content: '';
  position: absolute;
  height: 24px;
  width: 24px;
  left: 4px;
  bottom: 4px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 开启状态 */
.crawler-toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 20px rgba(74, 222, 128, 0.4);
}

.crawler-toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(28px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

/* 悬停效果 */
.crawler-toggle-switch:hover .toggle-slider {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(255, 255, 255, 0.3);
}

.crawler-toggle-switch input:checked:hover + .toggle-slider {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 25px rgba(74, 222, 128, 0.5);
}

/* 焦点状态 */
.crawler-toggle-switch input:focus + .toggle-slider {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .crawler-toggle-container {
    padding: 15px;
  }

  .toggle-icon {
    font-size: 24px;
  }

  .toggle-text h3 {
    font-size: 16px;
  }

  .toggle-description {
    font-size: 12px;
  }

  .crawler-toggle-switch {
    width: 50px;
    height: 28px;
  }

  .toggle-slider:before {
    height: 20px;
    width: 20px;
  }

  .crawler-toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }
}

/* 通道号表格外层容器 */
.channel-table-wrapper {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

/* 滚动容器 */
.channel-table-scroll-container {
  max-height: 300px;
  overflow: auto;
}

/* 表格 */
.channel-table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}

/* 表头 */
.channel-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.channel-table th {
  padding: 8px 10px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: none;
}

.channel-table tbody {
  background: #ffffff;
}

/* 自定义滚动条样式 */
.channel-table-scroll-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.channel-table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.channel-table-scroll-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.channel-table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
}

.channel-table-scroll-container::-webkit-scrollbar-corner {
  background: #f1f1f1;
}

.th-checkbox {
  width: 40px;
}

.th-index {
  width: 40px;
}

.th-channel {
  width: 80px;
}

.th-page {
  width: 80px;
}

.th-stats {
  width: 120px;
}

/* 表格行 */
.channel-row {
  border-bottom: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.channel-row:hover {
  background: #f8f9fa;
}

.channel-row:last-child {
  border-bottom: none;
}

/* 选中状态 */
.row-checked {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.row-checked:hover {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
}

/* 表格单元格 */
.channel-table td {
  padding: 6px 8px;
  text-align: center;
  font-size: 14px;
  color: #2d3748;
  border: none;
}

/* 序号单元格 */
.td-index {
  width: 40px;
  font-weight: 600;
  color: #667eea;
}

/* 复选框单元格 */
.td-checkbox {
  width: 40px;
}

.checkbox-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-mark {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e0;
  border-radius: 4px;
  background: #ffffff;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-mark::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s ease;
}

.checkbox-input:checked + .checkbox-mark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-mark::after {
  transform: rotate(45deg) scale(1);
}

.checkbox-label:hover .checkbox-mark {
  border-color: #667eea;
}

/* 通道号单元格 */
.td-channel {
  width: 80px;
  font-weight: 600;
  color: #4a5568;
}

.channel-icon {
  margin-right: 6px;
}

/* 页码单元格 */
.td-page {
  width: 80px;
}

/* 页码输入框 */
.page-input {
  width: 100%;
  /* max-width: 100px; */
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  color: #2d3748;
  background: #ffffff;
  transition: all 0.2s ease;
  outline: none;
}

.page-input:hover {
  border-color: #cbd5e0;
}

.page-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 统计单元格 */
.td-stats {
  width: 120px;
}

.stats-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .channel-table th,
  .channel-table td {
    padding: 5px 6px;
    font-size: 13px;
  }

  .page-input {
    max-width: 80px;
    padding: 5px 8px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .channel-table th,
  .channel-table td {
    padding: 4px 5px;
    font-size: 12px;
  }

  .th-channel {
    width: 25%;
  }

  .page-input {
    max-width: 60px;
    padding: 4px 6px;
    font-size: 12px;
  }

  .stats-badge {
    padding: 3px 8px;
    font-size: 11px;
  }
}
</style>
