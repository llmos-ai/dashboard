<template>
  <div>
    <a-space
      direction="vertical"
      class="w-full"
    >
      <a-auto-complete
        v-for="(arg, idx) in model"
        :key="idx"
        v-model:value="model[idx]"
        class="w-full"
        size="large"
        :placeholder="t('generic.placeholder', { text: '--dtype=half' }, true)"
        :label="t('workload.container.command.args')"
        :options="vllmOptions(idx)"
        :filter-option="filterArgsOption"
        @update:value="val => onUpdate(val, idx)"
      />
      <a-button
        class="mt-10"
        type="primary"
        @click="addArg"
      >
        添加参数
      </a-button>
    </a-space>
  </div>
</template>

<script setup>
import { VLLM_CONFIG } from '@shell/config/vllm-config';

const model = defineModel({
  type:     Array,
  required: true
});

const emit = defineEmits(['update:modelValue']);

function vllmOptions(idx) {
  const arg = model.value[idx] || '';
  const equalCount = (arg.match(/=/g) || []).length;

  const argsOptions = VLLM_CONFIG.find((item) => {
    if (equalCount === 1) {
      const key = arg.split('=')[0];

      return item.value === key;
    } else {
      return false;
    }
  });
  const hasArgsOptions = argsOptions && argsOptions.options?.length > 0;

  const allOptions = VLLM_CONFIG.map((item) => ({
    label: item.label || item,
    value: item.value || item
  }));

  const options = hasArgsOptions ? argsOptions.options.map((item) => ({
    value: `${ arg.split('=')[0] }=${ item }`,
    label: item
  })) : allOptions;

  return options;
}

function addArg() {
  model.value = [...model.value, ''];
}

function onUpdate(val, idx) {
  const newArgs = [...model.value];

  newArgs[idx] = val;
  emit('update:modelValue', newArgs);
}

function filterArgsOption(inputValue, option) {
  return option.value.toLowerCase().includes(inputValue.toLowerCase());
}
</script>
