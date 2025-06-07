<template>
  <div>
    <a-space
      direction="vertical"
      class="w-full"
    >
      <div
        v-for="(arg, idx) in model"
        :key="idx"
        class="flex items-center w-full"
      >
        <a-auto-complete
          v-model:value="model[idx]"
          class="w-full "
          size="large"
          :placeholder="t('generic.placeholder', { text: '--dtype=half' }, true)"
          :label="t('workload.container.command.args')"
          :options="vllmOptions(idx)"
          :filter-option="filterArgsOption"
          :disabled="isView || disabled"
          @update:value="val => onUpdate(val, idx)"
        />
        <a-button
          type="link"
          class="ml-2"
          :disabled="isView || disabled"
          @click="removeArg(idx)"
        >
          {{ t('generic.remove') }}
        </a-button>
      </div>
      <a-button
        class="mt-10"
        type="primary"
        :disabled="isView || disabled"
        @click="addArg"
      >
        添加参数
      </a-button>
    </a-space>
  </div>
</template>

<script setup>
import { VLLM_CONFIG } from '@shell/config/vllm-config';
import { computed } from 'vue';
import { _VIEW } from '@shell/config/query-params';

const model = defineModel({
  type:     Array,
  required: true,
  default:  () => []
});

const props = defineProps({
  mode: {
    default: null,
    type:    String
  },
  disabled: {
    default: false,
    type:    Boolean
  }
});

const isView = computed(() => props.mode === _VIEW);

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

function removeArg(idx) {
  const newArgs = [...model.value];

  newArgs.splice(idx, 1);
  emit('update:modelValue', newArgs);
}
</script>
