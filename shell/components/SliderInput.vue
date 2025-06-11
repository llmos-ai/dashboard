<script setup>
import { onMounted } from 'vue';
import { QuestionCircleOutlined } from '@ant-design/icons-vue';

const model = defineModel({
  type:    Number,
  default: 0,
});

const props = defineProps({
  min: {
    type:    Number,
    default: 0,
  },
  max: {
    type:    Number,
    default: 2,
  },
  interval: {
    type:    Number,
    default: 0.1,
  },
  label: {
    type:    String,
    default: '',
  },
  description: {
    type:    String,
    default: '',
  },

  defaultValue: {
    type:    Number,
    default: 0,
  },
});

const emit = defineEmits(['change']);

onMounted(() => {
  if (props.defaultValue) {
    model.value = props.defaultValue;
    emit('update:value', props.defaultValue);
  }
});

const updateValue = (value) => {
  model.value = value;

  emit('update:value', value);
  emit('change');
};
</script>

<template>
  <div class="row">
    <div class="col span-8 flex items-center">
      <span class="mr-1 text-sm">{{ label }}</span>

      <a-tooltip
        v-if="description"
        placement="topLeft"
      >
        <template #title>
          <span>{{ description }}</span>
        </template>
        <QuestionCircleOutlined />
      </a-tooltip>
    </div>

    <div class="col span-4 flex justify-end">
      <a-input-number
        v-model:value="model"
        :step="interval"
        :min="min"
        :max="max"
        @change="updateValue"
      />
    </div>
  </div>

  <div class="row">
    <div class="col span-12">
      <a-slider
        v-model:value="model"
        :step="interval"
        :min="min"
        :max="max"
        @change="updateValue"
      />
    </div>
  </div>
</template>
