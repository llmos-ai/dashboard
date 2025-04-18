<template>
  <a-space
    :size="[4, 4]"
    wrap
  >
    <a-tag
      v-for="(tag, index) in tags"
      :key="index"
    >
      <component
        :is="getTagIcon(tag)"
        class="tag-icon"
      />
      {{ tag }}
    </a-tag>
  </a-space>
</template>

<script setup>
import {
  RobotOutlined,
  BookOutlined,
  CodeOutlined,
  GlobalOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';

defineProps({
  tags: {
    type:    Array,
    default: () => []
  }
});

const getTagIcon = (tag) => {
  const tagLower = tag.toLowerCase();

  if (tagLower.includes('transformers')) return RobotOutlined;
  if (tagLower.includes('safetensors')) return SafetyOutlined;
  if (tagLower.includes('text-generation')) return FileTextOutlined;
  if (tagLower.includes('conversational')) return BookOutlined;
  if (tagLower.includes('code')) return CodeOutlined;
  if (tagLower.includes('dataset')) return DatabaseOutlined;
  if (tagLower.includes('region')) return GlobalOutlined;

  return SettingOutlined;
};

</script>

<style scoped>
.tag-icon {
  margin-right: 4px;
}
</style>
