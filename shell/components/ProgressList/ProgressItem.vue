<script setup>
import { computed } from 'vue';

const props = defineProps({
  file: {
    type:     Object,
    required: true
  },

  index: {
    type:     Number,
    required: true
  }
});

const fileName = computed(() => {
  return props.file.destPath.split('/').pop();
});

const percent = computed(() => {
  return Math.floor((props.file.readSize / props.file.totalSize) * 100);
});

// 判断文件是否错误
const isFileError = (file) => {
  return file.uploadStatus && file.uploadStatus.includes('error');
};

// 判断文件是否取消
const isFileCancelled = (file) => {
  return file.uploadStatus && file.uploadStatus.includes('cancelled');
};

// 获取文件状态图标
const getFileStatusIcon = (file) => {
  if (percent.value === 0) {
    return 'icon icon-clock';
  } else if (percent.value < 100) {
    return 'icon icon-spinner icon-spin';
  } else if (file.uploadStatus && file.uploadStatus.includes('processing')) {
    return 'icon icon-spinner icon-spin';
  } else if (isFileError(file)) {
    return 'icon icon-error';
  } else if (isFileCancelled(file)) {
    return 'icon icon-x';
  } else {
    return 'icon icon-checkmark';
  }
};

// 获取文件状态颜色
const getFileStatusColor = (file) => {
  if (percent.value === 0) {
    return '#d9d9d9';
  } else if (percent.value < 100) {
    return '#1890ff';
  } else if (isFileError(file)) {
    return '#ff4d4f';
  } else if (isFileCancelled(file)) {
    return '#d9d9d9';
  } else {
    return '#52c41a';
  }
};

// 获取文件状态文本
const getFileStatusText = (file) => {
  if (percent.value === 0) {
    return '等待上传';
  } else if (percent.value < 100) {
    return '正在上传';
  } else if (file.uploadStatus && file.uploadStatus.includes('processing')) {
    return '正在处理';
  } else if (isFileError(file)) {
    return '上传失败';
  } else if (isFileCancelled(file)) {
    return '已取消';
  } else {
    return '上传完成';
  }
};

// 获取文件进度条样式
const getFileProgressClass = (file) => {
  if (percent.value < 100) {
    return 'uploading';
  } else if (isFileError(file)) {
    return 'error';
  } else {
    return 'completed';
  }
};
</script>

<template>
  <div
    class="file-item"
    :class="{ 'active': percent > 0 && percent < 100 }"
  >
    <div class="file-info">
      <div class="file-path">
        <i class="icon icon-file" />
        <span class="path-text">
          {{ fileName }}
        </span>
      </div>
      <div class="file-status">
        <i
          :class="getFileStatusIcon(file)"
          :style="{ color: getFileStatusColor(file) }"
        />
        <span class="status-text">
          {{ getFileStatusText(file) }}
        </span>
      </div>
    </div>

    <div class="file-progress">
      <div class="progress-bar small">
        <div
          class="progress-fill"
          :style="{ width: percent + '%' }"
          :class="getFileProgressClass(file)"
        />
      </div>
      <div class="progress-percentage">
        {{ percent }}%
      </div>
    </div>

    <!-- 状态描述 -->
    <div
      v-if="file.uploadStatus"
      class="file-description"
    >
      {{ file.uploadStatus }}
    </div>
  </div>
</template>

<style scoped>
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

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
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
</style>
