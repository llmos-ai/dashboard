<template>
  <div
    v-if="isLoading"
    class="flex h-[32px]"
  >
    <LoadingOutlined />
  </div>
  <div
    v-else
    class="markdown-box-compile relative pb-6 marked-view"
  >
    <div
      v-if="props.reasoningContent"
      class="think-wrapper mb-10"
    >
      <a-button
        type="text"
        size="small"
        class="role-link mb-10"
        @click="showReasoningContent = !showReasoningContent"
      >
        <div class="flex items-center">
          {{ compileHtml.content ? '已完成思考' : '深度思考中' }}
          <DownOutlined v-if="showReasoningContent" />
          <UpOutlined v-else />
        </div>
      </a-button>
      <div
        v-if="showReasoningContent"
        class="border-l-2 border-[#e5e5e5] pl-4"
      >
        <div v-html="compileHtml.reasoningContent" />
      </div>
    </div>
    <div v-html="compileHtml.content" />

    <div
      v-if="showActions"
      class="action absolute -bottom-6"
    >
      <span class="bg-[#f2f6fb] px-2 py-2 rounded-md">
        <!-- TODO: fetch new api -->
        <!-- <a-button type="link" size="small" class="role-link" @click="refreshFetch">
        <i class="icon icon-backup" />
      </a-button> -->

        <a-button
          type="link"
          size="small"
          class="copy-button role-link"
          :data-code="encodeURIComponent(content)"
        >
          <i class="icon icon-copy" />
        </a-button>
      </span>
    </div>
  </div>
</template>

<script setup>
import {
  computed, onMounted, watch, nextTick, onUnmounted, ref
} from 'vue';
import { marked } from 'marked';
import {
  LoadingOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons-vue';
import 'highlight.js/styles/github.css';

const props = defineProps({
  content: {
    type:    String,
    default: '',
  },
  reasoningContent: {
    type:    String,
    default: '',
  },
  showActions: {
    type:    Boolean,
    default: true,
  },
  loading: {
    type:    Boolean,
    default: true,
  },
});

const renderer = new marked.Renderer();

const showReasoningContent = ref(true);

// TODO: enhance code preview renderer
renderer.code = function(code, language) {
  const validLanguage = language || 'plaintext';
  const highlightedCode = this.options.highlight(code, validLanguage);

  return `
    <div class="code-block-wrapper">
      <div class="code-header sticky top-0">
        <span class="code-language">${ validLanguage }</span>
        <a-button class="copy-button" data-code="${ encodeURIComponent(code) }">
          <i class="icon icon-copy"></i>
        </a-button>
      </div>
      <pre><code class="hljs language-${ validLanguage }">测试是否渲染了这一块${ highlightedCode }</code></pre>
    </div>`;
};

marked.setOptions({
  renderer,
  highlight(code, lang) {
    const hljs = require('highlight.js');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';

    try {
      return hljs.highlight(code, { language }).value;
    } catch (err) {
      return code;
    }
  },
  langPrefix: 'hljs language-',
  breaks:     true,
  gfm:        true,
});

const isLoading = computed(() => {
  const loading =
    props.loading &&
    compileHtml.value.content.length === 0 &&
    compileHtml.value.reasoningContent.length === 0;

  return loading;
});

const compileHtml = computed(() => {
  return {
    content:          marked.parse(props.content),
    reasoningContent: marked.parse(props.reasoningContent),
  };
});

const initializeCopyButtons = () => {
  nextTick(() => {
    const copyButtons = document.querySelectorAll('.copy-button');

    copyButtons.forEach((button) => {
      button.addEventListener('click', handleCopy);
    });
  });
};

const handleCopy = async(event) => {
  const button = event.currentTarget;
  const code = decodeURIComponent(button.dataset.code);

  try {
    await navigator.clipboard.writeText(code);
    const icon = button.querySelector('i');

    icon.className = 'icon icon-checkmark';
    setTimeout(() => {
      icon.className = 'icon icon-copy';
    }, 1000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

onMounted(() => {
  initializeCopyButtons();
});

watch(
  [() => props.content, () => props.reasoningContent],
  () => {
    nextTick(() => {
      initializeCopyButtons();
    });
  },
  { immediate: true }
);

onUnmounted(() => {
  const copyButtons = document.querySelectorAll('.copy-button');

  copyButtons.forEach((button) => {
    button.removeEventListener('click', handleCopy);
  });
});
</script>

<style lang="scss" scoped>
.marked-view {
  min-height: 40px;
  flex-direction: column;
  flex-grow: 0;
  flex-basis: 100%;

  .action {
    opacity: 0;
    transition: opacity 0.4s ease-in-out;

    border-radius: 4px;

    button {
      padding: 4px 6px;
    }
  }

  &:hover .action {
    opacity: 1;
  }
}

:deep(.code-block-wrapper) {
  position: relative;
  margin: 1em 0;

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em 1em;
    background: var(--border);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;

    .code-language {
      font-size: 0.9em;
      color: var(--text-muted);
    }

    .copy-button {
      padding: 4px 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }

      i {
        font-size: 14px;
      }
    }
  }

  pre {
    margin: 0;
    border-top: none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}
</style>
