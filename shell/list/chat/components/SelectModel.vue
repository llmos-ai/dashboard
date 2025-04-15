<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { ML_WORKLOAD_TYPES } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

const store = useStore();

const emits = defineEmits(['update:value']);

defineProps({
  model: {
    type:    String,
    default: '',
  },
});

const modelService = store.getters['cluster/all'](
  ML_WORKLOAD_TYPES.MODEL_SERVICE
);

const modelOptions = computed(() => {
  return modelService.filter((model) => model.isRunning).map((model) => {
    return {
      label: model.metadata.name,
      value: model,
    };
  });
});

const changeModel = (model) => {
  emits('update:value', model);
};
</script>

<script>
export default {
  setup() {

  }
};
</script>

<template>
  <LabeledSelect
    :value="model"
    :label="t('chat.model')"
    :options="modelOptions"
    @update:value="changeModel"
  />
</template>
