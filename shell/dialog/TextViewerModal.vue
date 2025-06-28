<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { message } from 'ant-design-vue';

import CodeMirror from '@shell/components/CodeMirror';

import { _EDIT } from '@shell/config/query-params';
import { modeInfo } from '@shell/config/code-mirror-modes';

const props = defineProps({
  title: {
    type:    String,
    default: 'Text Viewer',
  },

  content: {
    type:    String,
    default: '',
  },

  fileType: {
    type:    String,
    default: 'text',
  },

  readOnly: {
    type:    Boolean,
    default: true,
  },

  maxHeight: {
    type:    String,
    default: '400px',
  },

  beforeClose: {
    type:    Function,
    default: () => {},
  },

  contentFunc: {
    type:    Function,
    default: () => {},
  },

  mode: {
    type:    String,
    default: _EDIT,
  },
});

const emit = defineEmits(['close']);

const contentDisplay = ref('');
const loading = ref(false);
const downloading = ref(false);

onBeforeMount(async() => {
  loading.value = true;

  try {
    if (props.contentFunc) {
      contentDisplay.value = await props.contentFunc.apply(this);
    } else {
      contentDisplay.value = props.content;
    }
  } catch (err) {
    message.error(err);
  }

  loading.value = false;
});

const canCodeMirrorRender = computed(() => {
  let exts = [];

  modeInfo.map((m) => {
    exts = [...exts, ...(m.ext || [])];
  });

  if (exts.includes(props.fileType)) {
    return true;
  } else {
    return false;
  }
});

const languageMode = computed(() => {
  const mode = modeInfo.find((m) => {
    const extendNames = m.ext || [];

    if (extendNames.includes(props.fileType)) {
      return true;
    } else {
      return false;
    }
  });

  return mode?.mode || 'yaml';
});

const close = () => {
  props.beforeClose();
  emit('close');
};

const downloadFile = async() => {
  if (!props.title || !contentDisplay.value) {
    return;
  }

  downloading.value = true;

  try {
    // 创建Blob对象
    const blob = new Blob([contentDisplay.value], { type: 'text/plain;charset=utf-8' });

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = props.title;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    message.error('下载文件失败:', error);
  } finally {
    downloading.value = false;
  }
};
</script>

<template>
  <a-card
    :title="title"
    :show-highlight-border="false"
    :sticky="true"
    class="text-viewer-modal"
    :loading="loading"
  >
    <div class="text-viewer-content">
      <div
        class="text-viewer-body"
        :style="{ maxHeight: maxHeight }"
      >
        <pre
          v-if="fileType === 'text' || !fileType"
          class="text-content"
        >
          {{ contentDisplay }}
        </pre>

        <CodeMirror
          v-else-if="canCodeMirrorRender"
          :value="contentDisplay"
          :options="{
            mode: languageMode,
            lineNumbers: false,
            readOnly,
            lineWrapping: true,
          }"
          :mode="mode"
        />

        <div
          v-else
          class="unsupported-preview"
        >
          <div class="unsupported-message">
            <i class="icon icon-file-text" />
            <p>当前文件暂不支持预览</p>
            <p class="file-info">
              {{ title }}
            </p>
            <a-button
              v-if="false"
              type="primary"
              :loading="downloading"
              @click="downloadFile"
            >
              下载文件
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <template #actions>
      <a-button
        @click="close"
      >
        {{ t('generic.close') }}
      </a-button>
    </template>
  </a-card>
</template>

<style lang="scss" scoped>
.text-viewer-modal {
  .text-viewer-content {
    padding: 0 10px;

    .text-viewer-toolbar {
      display: flex;
      justify-content: flex-end;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 10px;
    }

    .text-viewer-body {
      overflow-y: auto;
      border: 1px solid #d9d9d9;
      border-radius: 4px;

      .text-content {
        margin: 0;
        padding: 12px;
        background-color: #fafafa;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .unsupported-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        background-color: #fafafa;

        .unsupported-message {
          text-align: center;
          color: #666;

          .icon {
            font-size: 48px;
            margin-bottom: 16px;
            color: #ccc;

            &.icon-download {
              font-size: 14px;
              margin-right: 8px;
              margin-bottom: 0;
            }
          }

          p {
            margin: 8px 0;
            font-size: 14px;

            &.file-info {
              font-size: 12px;
              color: #999;
              word-break: break-all;
              margin-bottom: 16px;
            }
          }

          .ant-btn {
            margin-top: 8px;
          }
        }
      }
    }
  }
}
</style>
