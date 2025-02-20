<script>
import { marked } from 'marked';
import { Card } from '@components/Card';
import 'highlight.js/styles/github.css';

const renderer = new marked.Renderer();

renderer.code = function(code, language) {
  const validLanguage = language || 'plaintext';
  const highlightedCode = this.options.highlight(code, validLanguage);

  return `<div class="code-block-wrapper">
    <div class="code-header">
      <span class="code-language">${ validLanguage }</span>
      <button class="copy-button"  data-code="${ encodeURIComponent(code) }">
        <i class="icon icon-copy"></i>
      </button>
    </div>
    <pre><code class="hljs language-${ validLanguage }">${ highlightedCode }</code></pre>
  </div>`;
};

marked.setOptions({
  renderer,
  highlight(code, lang) {
    const hljs = require('highlight.js');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';

    const highlightedCode = hljs.highlight(code, { language }).value;

    try {
      return highlightedCode;
    } catch (err) {
      return code;
    }
  },
  langPrefix:   'hljs language-',
  breaks:       true,
  gfm:          true,
  headerIds:    true,
  headerPrefix: '',
  mangle:       true,
  pedantic:     false,
  sanitize:     false,
  silent:       false,
  smartLists:   false,
  smartypants:  false,
  xhtml:        false
});

export default {
  components: { Card },
  props:      {
    content: {
      default: '',
      type:    String
    }
  },

  mounted() {
    this.initializeCopyButtons();
  },

  watch: {
    // 监听 content 变化，重新绑定复制按钮的事件
    content() {
      this.$nextTick(() => {
        this.initializeCopyButtons();
      });
    }
  },

  methods: {
    initializeCopyButtons() {
      this.$nextTick(() => {
        const copyButtons = this.$el.querySelectorAll('.copy-button');

        copyButtons.forEach((button) => {
          button.addEventListener('click', this.handleCopy);
        });
      });
    },

    async handleCopy(event) {
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
        // eslint-disable-next-line no-console
        console.error('copy failed:', err);
      }
    }
  },

  computed: {
    compileHtml() {
      return marked.parse(this.content);
    }
  }
};
</script>

<template>
  <Card
    :show-highlight-border="false"
    :hasDivider="false"
    :showActions="false"
    class="marked-view"
  >
    <div
      slot="body"
    >
      <div
        class="markdown-box-compile"
        v-html="compileHtml"
      />

      <div class="action">
        <button
          type="button"
          class="btn btn-sm role-link"
        >
          <i class="icon icon-backup" />
        </button>

        <button
          type="button"
          class="copy-button btn btn-sm role-link"
          :data-code="encodeURIComponent(content)"
        >
          <i class="icon icon-copy" />
        </button>
      </div>
    </div>
  </card>
</template>

<style lang="scss" scoped>
.marked-view {
  min-height: 40px;
  padding-bottom: 20px;
  flex-direction: column;
  flex-grow: 0;
  flex-basis: 100%;
  position: relative;

  align-items: flex-start !important;

    .action {
      position: absolute;
      bottom: 4px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.4s ease-in-out;

      border: 2px solid var(--border);
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
