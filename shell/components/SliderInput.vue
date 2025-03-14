<script setup>
import { QuestionCircleOutlined } from "@ant-design/icons-vue";

const model = defineModel();

const props = defineProps({
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 2,
  },
  interval: {
    type: Number,
    default: 0.1,
  },
  label: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["change"]);

const updateValue = (value) => {
  model.value = value;
  emit("change");
};
</script>

<template>
  <div class="row">
    <div class="col span-8 flex items-center">
      <span class="label mr-1">{{ label }}</span>

      <a-tooltip placement="topLeft" v-if="description">
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
