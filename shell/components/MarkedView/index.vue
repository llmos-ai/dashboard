<template>
  <div> 
    <div v-if="isLoading" class="flex h-[32px]"><LoadingOutlined /></div>
    <div ref="markdown-viewer" v-else>
      <component
        :is="renderItem(token)"
        v-for="(token, index) in tokens"
        :key="index"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, onMounted, watch, computed, useTemplateRef, h, VNode
} from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';
import { Checkbox, Image, Typography } from 'ant-design-vue';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import { unescape } from 'lodash';
import { marked } from 'marked';

import { nextTick } from 'process';
import CodeBox from './CodeBox.vue';

const markdownDOM = useTemplateRef('markdown-viewer');
const { Text, Link, Paragraph } = Typography;

const props = defineProps({
  content: {
    type:    String,
    default: ''
  },
  showLoading: {
    type:    Boolean,
    default: false
  },
  isThink: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: ''
  }
});

const isLoading = computed(() => {
  return props.showLoading && props.content?.length === 0;
})

const renderer = new marked.Renderer();

const reDefineTypes = [
  'image',
  'link',
  'heading',
  'paragraph',
  'text',
  'codespan',
  'code',
  'strong',
  'list',
  'list_item',
  'hr',
  'br',
  'blockquote',
  'em',
  'escape',
  'del',
  'checkbox',
];

marked.use({
  extensions: [
    {
      name:  'details',
      level: 'block',
      start(src) {
        return src.match(/<details>/)?.index;
      },
      tokenizer(src) {
        const match = src.match(/^<details>([\s\S]*?)<\/details>/);

        if (match) {
          return {
            type: 'details',
            raw:  match[0],
            text: match[1]
          };
        }
      },
      renderer(token) {
        return `<details>${ marked.parse(token.text) }</details>`;
      }
    },
  ]
});
const tokens = ref(marked.lexer(props.content));

const renderItem = (token) => {
  if (!reDefineTypes.includes(token.type)) {
    return h('span', { innerHTML: marked.parser([token]) });
  }
  let htmlstr = null;
  let child: string | VNode | null = null;

  if (token.tokens?.length) {
    // 所有的多层结构都会在此遍历child
    child = token.tokens.map((token) => renderItem(token));
  } else {
    child = unescape(token.text);
  }

  if (token.type === 'image') {
    htmlstr = h(Image, {
      src: token.href,
      alt: token.text
    });
  }

  if (token.type === 'link') {
    htmlstr = h(
      Link,
      {
        href:   token.href,
        title:  token.title || '',
        target: '_blank',
        rel:    'noopener noreferrer'
      },
      () => child
    );
  }

  // // h1 ~ h6
  // // TODO: h1 pading-top: 0, h2-padding: xxx
  if (token.type === 'heading') {
    htmlstr = h(Typography.Title, { level: token.depth }, () => child);
  }

  // // 解析段落 (里面可能有child)
  if (token.type === 'paragraph') {
    htmlstr = h(Paragraph, {
      style: {
        color: props.color
      }
    }, () => child);
  }

  // // TODO: delete ?
  if (token.type === 'text') {
    htmlstr = child;
  }

  if (token.type === 'codespan') {
    htmlstr = h(Text, { code: true }, () => child);
  }

  if (token.type === 'list') {
    const listItems = token.items.map((item) => renderItem(item));

    htmlstr = token.order ? h('ol', {}, listItems) : h('ul', {}, listItems);
  }

  if (token.type === 'list_item') {
    htmlstr = h('li', {}, child);
  }

  if (token.type === 'strong') {
    htmlstr = h(Text, { strong: true }, () => child);
  }

  if (token.type === 'code') {
    // TODO: theme

    htmlstr = h(CodeBox, {
      value: token.text
    });
  }

  if (token.type === 'blockquote') {
    htmlstr = h('blockquote', null, () => child);
  }

  if (token.type === 'escape') {
    htmlstr = h('span', {}, child);
  }

  if (token.type === 'del') {
    htmlstr = h('del', child);
  }

  if (token.type === 'checkbox') {
    htmlstr = h(Checkbox, { value: token.checked });
  }

  if (token.type === 'br') {
    htmlstr = h('br');
  }

  if (token.type === 'em') {
    htmlstr = h('em', {}, child);
  }

  if (token.type === 'hr') {
    htmlstr = h('hr', { class: 'my-5' });
  }

  return htmlstr;
};

onMounted(() => {
  nextTick(() => {
    // try {
    //   renderMathInElement(markdownDOM.value, {
    //     delimiters: [
    //       {
    //         left: '$$', right: '$$', display: true
    //       },
    //       {
    //         left: '$', right: '$', display: false
    //       },
    //       {
    //         left: '\\(', right: '\\)', display: false
    //       },
    //       {
    //         left: '\\[', right: '\\]', display: true
    //       }
    //     ],
    //     throwOnError: false
    //   });
    // } catch (err) {
    // }
  });
});

watch(
  () => props.content,
  (newContent) => {
    tokens.value = marked.lexer(newContent);
  }
);
</script>

<style lang="scss" scoped>
:deep() {
  ul {
    list-style-type: disc;
    padding-left: 20px;
  }

  ul li {
    padding-left: 5px;
    color: rgba(0, 0, 0, 0.85);
    transition: color 0.3s ease-in-out;
  }

  ul li::marker {
    color: rgba(0, 0, 0, 0.65);
    font-weight: 500;
  }

  ol {
    list-style-type: decimal;
    padding-left: 20px;
  }

  ol li {
    padding-left: 5px;
    color: rgba(0, 0, 0, 0.85);
    transition: color 0.3s ease-in-out;
  }

  ol li::marker {
    color: rgba(0, 0, 0, 0.65);
    font-weight: 500;
  }

  details {
    border-radius: 6px;
    padding: 12px 16px;
    margin: 12px 0;
    transition: background 0.3s ease, border-color 0.3s ease;
  }

  details[open] {
    background: #f0f0f0;
    border-color: #bfbfbf;
  }

  summary {
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    list-style: none;
    padding: 4px 0;
    color: rgba(0, 0, 0, 0.85);
    transition: color 0.3s ease;
  }

  summary::before {
    content: "▶";
    font-size: 12px;
    margin-right: 8px;
    transition: transform 0.3s ease-in-out;
    display: inline-block;
    color: rgba(0, 0, 0, 0.65);
  }

  details[open] summary::before {
    transform: rotate(90deg);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 14px;
    text-align: left;
  }

  th, td {
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tr:hover {
    background: #f0f0f0;
  }
}
</style>
