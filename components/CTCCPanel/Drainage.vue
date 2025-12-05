<template>
  <div class="crawler-panel-body">
    <!-- 最近的接口列表 -->
    <div class="crawler-section">
      <h3>抓取到的引流接口：</h3>
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
    <div class="crawler-section">
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
    <div class="crawler-status">
      状态: {{ statusText }} | 已收集: <span class="highlight">{{ dataCount }}</span> 条数据
    </div>

    <!-- 按钮组 -->
    <div class="crawler-button-group">
      <!-- 开始/暂停/继续 按钮 (共用一个位置) -->
      <button v-if="!isAutoCrawling && !isPaused" class="crawler-btn crawler-btn-primary" @click="startAutoCrawl">
        ▶️ 开始爬取
      </button>
      <button v-else-if="isAutoCrawling && !isPaused" class="crawler-btn crawler-btn-warning" @click="pauseCrawl">
        ⏸️ 暂停爬取
      </button>
      <button v-else-if="isPaused" class="crawler-btn crawler-btn-primary" @click="startAutoCrawl">▶️ 继续爬取</button>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCrawlerSubportOrDrainageData } from '@/composables/useCrawlerSubportOrDrainageData'
import { getShortUrl, formatTime } from '@/utils/utils'
import { drainageReqUrls } from '@/utils/config'
import { ExportTypeEnum } from '@/types'

defineOptions({ name: 'Drainage' })
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
} = useCrawlerSubportOrDrainageData({ reqUrls: drainageReqUrls, exportType: ExportTypeEnum.DRAINAGE })
</script>

<style scoped></style>
