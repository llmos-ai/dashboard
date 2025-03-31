<script setup>
import { ref, watch } from 'vue';
import { CopyOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const props = defineProps({
  value: {
    type:    String,
    default: ''
  },
  showLang: {
    type:    Boolean,
    default: false
  }
});

const codeBox = ref(null);
const handleCopy = () => {
  navigator.clipboard.writeText(props.value).then(() => {
    message.success('复制成功');
  });
};

const code = ref('');
const lang = ref('');

watch(() => props.value, (value) => {
  const highlightedCode = hljs.highlightAuto(props.value) || {};

  code.value = highlightedCode.value;
  lang.value = highlightedCode.language;
}, { immediate: true });

</script>

<template>
  <div
    ref="codeBox"
    class="code-box mt-4"
  >
    <div
      class="header flex items-center justify-between px-3 py-2"
      @click="handleCopy"
    >
      <span v-if="showLang">{{ lang }}</span>
      <CopyOutlined class="cursor-pointer ml-auto" />
    </div>
    <div>
      <pre class="pt-0"><code v-clean-html="code" /></pre>
    </div>
  </div>
</template>

<style scoped>
.code-box {
  position: relative;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--box-bg);
}

.copy-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.copy-icon:hover {
  color: #1890ff;
}
</style>
