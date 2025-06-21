<template>
  <a-modal
    v-model:visible="modalVisible"
    :title="title"
    :closable="false"
    :maskClosable="false"
    :footer="null"
    width="600px"
    centered
  >
    <div class="progress-modal">
      <!-- 文件列表 -->
      <div class="file-list">
        <div class="file-items">
          <div 
            v-for="(file, index) in fileList" 
            :key="index"
            class="file-item"
            :class="{ 'active': file.percent > 0 && file.percent < 100 }"
          >
            <!-- 文件信息 -->
            <div class="file-info">
              <div class="file-path">
                <i class="icon icon-file" />
                <span class="path-text">{{ file.destPath || `文件 ${index + 1}` }}</span>
              </div>
              <div class="file-status">
                <i :class="getFileStatusIcon(file)" :style="{ color: getFileStatusColor(file) }" />
                <span class="status-text">{{ getFileStatusText(file) }}</span>
              </div>
            </div>

            <!-- 文件进度条 -->
            <div class="file-progress">
              <div class="progress-bar small">
                <div 
                  class="progress-fill" 
                  :style="{ width: file.percent + '%' }"
                  :class="getFileProgressClass(file)"
                />
              </div>
              <div class="progress-percentage">{{ file.percent }}%</div>
            </div>

            <!-- 状态描述 -->
            <div v-if="file.uploadStatus" class="file-description">
              {{ file.uploadStatus }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button 
          v-if="canCancelAll" 
          type="default" 
          @click="handleCancelAll"
        >
          取消全部
        </a-button>
        <a-button 
          type="primary" 
          @click="close"
        >
          关闭
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script>
export default {
  name: 'ProgressModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '文件上传进度'
    },
    fileList: {
      type: Array,
      default: () => []
      // 每个文件对象格式: { destPath: string, percent: number, uploadStatus: string }
    },
    onCancelAll: {
      type: Function,
      default: null
    }
  },
  emits: ['update:visible', 'cancel-all', 'close'],

  data() {
    return {
      modalVisible: false
    }
  },

  computed: {
    // 总体进度百分比
    overallPercent() {
      if (this.fileList.length === 0) return 0
      const totalPercent = this.fileList.reduce((sum, file) => sum + file.percent, 0)
      return Math.round(totalPercent / this.fileList.length)
    },
    
    // 已完成文件数量
    completedCount() {
      return this.fileList.filter(file => file.percent >= 100).length
    },
    
    // 总体进度条样式
    overallProgressClass() {
      if (this.overallPercent < 100) {
        return 'uploading'
      } else if (this.fileList.some(file => this.isFileError(file))) {
        return 'error'
      } else {
        return 'completed'
      }
    },
    
    // 是否可以取消全部
    canCancelAll() {
      return this.onCancelAll && this.fileList.some(file => 
        file.percent < 100 && !this.isFileError(file)
      )
    },
    
    // 是否全部完成
    isAllCompleted() {
      return this.fileList.length > 0 && this.fileList.every(file => 
        file.percent >= 100 || this.isFileError(file) || this.isFileCancelled(file)
      )
    }
  },
  methods: {
    // 判断文件是否错误
    isFileError(file) {
      return file.uploadStatus && file.uploadStatus.includes('error')
    },
    
    // 判断文件是否取消
    isFileCancelled(file) {
      return file.uploadStatus && file.uploadStatus.includes('cancelled')
    },
    
    // 获取文件状态图标
    getFileStatusIcon(file) {
      if (file.percent === 0) {
        return 'icon icon-clock'
      } else if (file.percent < 100) {
        return 'icon icon-spinner icon-spin'
      } else if (file.uploadStatus && file.uploadStatus.includes('processing')) {
        return 'icon icon-spinner icon-spin'
      } else if (this.isFileError(file)) {
        return 'icon icon-error'
      } else if (this.isFileCancelled(file)) {
        return 'icon icon-x'
      } else {
        return 'icon icon-checkmark'
      }
    },
    
    // 获取文件状态颜色
    getFileStatusColor(file) {
      if (file.percent === 0) {
        return '#d9d9d9'
      } else if (file.percent < 100) {
        return '#1890ff'
      } else if (this.isFileError(file)) {
        return '#ff4d4f'
      } else if (this.isFileCancelled(file)) {
        return '#d9d9d9'
      } else {
        return '#52c41a'
      }
    },
    
    // 获取文件状态文本
    getFileStatusText(file) {
      if (file.percent === 0) {
        return '等待上传'
      } else if (file.percent < 100) {
        return '正在上传'
      } else if (file.uploadStatus && file.uploadStatus.includes('processing')) {
        return '正在处理'
      } else if (this.isFileError(file)) {
        return '上传失败'
      } else if (this.isFileCancelled(file)) {
        return '已取消'
      } else {
        return '上传完成'
      }
    },
    
    // 获取文件进度条样式
    getFileProgressClass(file) {
      if (file.percent < 100) {
        return 'uploading'
      } else if (this.isFileError(file)) {
        return 'error'
      } else {
        return 'completed'
      }
    },
    
    // 关闭模态框
    close() {
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    
    // 取消全部上传
    handleCancelAll() {
      if (this.onCancelAll) {
        this.onCancelAll()
      }
      this.$emit('cancel-all')
    }
  },

  watch : {
    visible: {
      immediate: true,
      handler(val) {
        this.modalVisible = val
      }
    },

    fileList: {
      handler(val) {
        console.log(val, 'val')
      },
    }
  },
}
</script>

<style scoped>
.progress-modal {
  padding: 16px 0;
}

/* 整体进度 */
.overall-progress {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.progress-count {
  font-size: 14px;
  color: #666;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar.small {
  height: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-fill.uploading {
  background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
}

.progress-fill.completed {
  background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
}

.progress-fill.error {
  background: linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%);
}

.progress-text {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 文件列表 */
.file-list {
  margin-bottom: 24px;
}

.file-list-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.file-items {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.file-item.active {
  border-color: #1890ff;
  background-color: #f6ffed;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-path {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-path .icon {
  margin-right: 8px;
  color: #1890ff;
  flex-shrink: 0;
}

.path-text {
  font-size: 14px;
  color: #333;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.file-status .icon {
  margin-right: 4px;
  font-size: 14px;
}

.status-text {
  font-size: 12px;
  color: #666;
}

.file-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-progress .progress-bar {
  flex: 1;
  margin-bottom: 0;
}

.progress-percentage {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: right;
}

.file-description {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  word-break: break-all;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 动画 */
.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.file-items::-webkit-scrollbar {
  width: 6px;
}

.file-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.file-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.file-items::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>