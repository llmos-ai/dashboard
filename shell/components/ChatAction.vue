<script setup>
import { CopyOutlined, SyncOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  size: {
    type:    String,
    default: 'small',
  },
  showRegenerate: {
    type:    Boolean,
    default: false,
  },
  copyContent: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['regenerate', 'copy']);

const handleCopy = async() => {
  await navigator.clipboard.writeText(props.copyContent);
  emit('copy');
};

const handleRegenerate = () => {
  emit('regenerate');
};
</script>

<template>
  <a-space :size="size">
    <slot name="prefix" />

    <a-tooltip title="复制">
      <a-button
        type="text"
        :size="size"
        @click="handleCopy"
      >
        <CopyOutlined />
      </a-button>
    </a-tooltip>

    <a-tooltip
      v-if="showRegenerate"
      title="重新生成"
    >
      <a-button
        type="text"
        :size="size"
        @click="handleRegenerate"
      >
        <SyncOutlined />
      </a-button>
    </a-tooltip>

    <slot name="suffix" />
  </a-space>
</template>
