<script setup>
import { CopyOutlined, SyncOutlined } from '@ant-design/icons-vue';

defineProps({
  size: {
    type:    String,
    default: 'small',
  },
  showRegenerate: {
    type:    Boolean,
    default: false,
  }
});

const emit = defineEmits(['regenerate', 'copy']);

const handleCopy = async() => {
  emit('copy');
};

const handleRegenerate = () => {
  emit('regenerate');
};
</script>

<template>
  <a-space :size="size">
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

    <slot />
  </a-space>
</template>
