<script setup>
import { Workflow, MessagesSquare, Braces } from 'lucide-vue-next';
import { computed } from 'vue';

// 定义组件props
const props = defineProps({
  type: {
    type:      String,
    required:  true,
    validator: (value) => ['workflow', 'message', 'braces'].includes(value)
  },
  color: {
    type:    String,
    default: '#5d8be3'
  },
  size: {
    type:    [String, Number],
    default: 24
  }
});

// 根据背景色计算对比色
const getContrastColor = (hexColor) => {
  // 移除#号
  const color = hexColor.replace('#', '');

  // 转换为RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 根据亮度返回对比色
  return brightness > 128 ? '#ffffff' : '#000000';
};

// 计算图标颜色
const iconColor = computed(() => {
  if (props.color === 'currentColor') {
    return 'currentColor';
  }

  return getContrastColor(props.color);
});

// 根据type计算对应的图标组件
const IconComponent = computed(() => {
  const iconMap = {
    workflow: Workflow,
    message:  MessagesSquare,
    braces:   Braces
  };

  return iconMap[props.type] || Workflow;
});
</script>

<template>
  <div
    class="lang-flow-icon w-[28px] h-[28px] item-center flex justify-center rounded-lg p-1.5 transition-opacity text-electric-blue duration-300"
    :style="{ backgroundColor: props.color }"
  >
    <component
      :is="IconComponent"
      :color="iconColor"
      size="16"
    />
  </div>
</template>

<style scoped>
.lang-flow-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
