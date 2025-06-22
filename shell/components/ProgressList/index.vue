<script setup>
import ProgressItem from './ProgressItem.vue';

defineProps({
  visible: {
    type:    Boolean,
    default: false
  },
  fileList: {
    type:    Array,
    default: () => []
  },
  onCancelAll: {
    type:    Function,
    default: null
  },
});
</script>

<template>
  <div class="progress-modal">
    <a-empty
      v-if="fileList.length === 0"
      description="当前无文件上传"
    />
    <div
      v-else
      class="file-list"
    >
      <div class="file-items">
        <ProgressItem
          v-for="(file, index) in fileList"
          :key="index"
          :file="file"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-modal {
  padding: 16px 0;
}

.file-list {
  margin-bottom: 24px;
}

.file-items {
  max-height: 300px;
  overflow-y: auto;
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
