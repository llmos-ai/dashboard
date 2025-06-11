<script>
export default {
  name: 'TextViewer',

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

    readonly: {
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
  },

  emits: ['close'],

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
  >
    <div class="text-viewer-content">
      <div
        class="text-viewer-body"
        :style="{ maxHeight: maxHeight }"
      >
        <pre
          v-if="language === 'text' || !language"
          class="text-content"
        >{{ content }}</pre>

        <code-mirror
          v-else
          :value="content"
          :options="{
            mode: language,
            theme: 'default',
            lineNumbers: true,
            readOnly: readonly,
            lineWrapping: true,
          }"
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
