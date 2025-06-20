<script>
import CodeMirror from '@shell/components/CodeMirror';

import { _EDIT } from '@shell/config/query-params';

export default {
  name: 'TextViewer',

  components: { CodeMirror },

  props: {
    title: {
      type:    String,
      default: 'Text Viewer',
    },

    content: {
      type:    String,
      default: '',
    },

    language: {
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
  },

  emits: ['close'],

  data() {
    return {
      contentDisplay: '',
      loading:        false,
    };
  },

  async fetch() {
    this.loading = true;

    try {
      if (this.contentFunc) {
        this.contentDisplay = await this.contentFunc.apply(this);
      } else {
        this.contentDisplay = this.content;
      }
    } catch (err) {
      this.$message.error(err);
    }

    this.loading = false;
  },

  methods: {
    close() {
      this.beforeClose();
      this.$emit('close');
    },
  },
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
          v-if="language === 'text' || !language"
          class="text-content"
        >
          {{ contentDisplay }}
        </pre>

        <CodeMirror
          v-else
          :value="contentDisplay"
          :options="{
            mode: language,
            lineNumbers: false,
            readOnly,
            lineWrapping: true,
          }"
          :mode="mode"
        />
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
    }
  }
}
</style>
