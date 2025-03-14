<script setup>
import { defineEmits, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { ML_WORKLOAD_TYPES } from '@shell/config/types';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SliderInput from '@shell/components/SliderInput.vue';

const store = useStore();
const emits = defineEmits(['update:model', ['reset:messages']]);
const config = defineModel('config');
const props = defineProps({
  messages: {
    type: Array,
    default: [],
  },
});
const currentModel = ref('');
const modelService = store.getters['cluster/all'](
  ML_WORKLOAD_TYPES.MODEL_SERVICE
);
const modelOptions = modelService.map((model) => {
  return {
    label: model.spec.model,
    value: model.spec.model,
    model: model,
  };
});

const update = () => {
  // TODO: enhance validation
  if (config.value.seed) {
    config.value.seed = Number(config.value.seed);
  }
  config.value.seed = config.value.seed ? Number(config.value.seed) : null;
  config.value.stop = config.value.seed ? config.value.stop : null;
};

const visible = ref(false);
const preventChangeModel = ref(false);
const confirm = () => {
  emits('reset:messages', []);
  visible.value = false;
};

const cancel = () => {
  visible.value = false;
  // 还原config.model值
  config.value.model = previousModel.value;
  preventChangeModel.value = false;
};

const changeModel = (value, option) => {
  preventChangeModel.value = true;
  currentModel.value = option.model;
};

const previousModel = ref('');
watch(
  () => config.value.model,
  (newValue, oldValue) => {
    previousModel.value = oldValue;
    if (
      newValue !== oldValue &&
      preventChangeModel.value &&
      oldValue &&
      props.messages.length
    ) {
      visible.value = true;
    }
    emits('update:model', currentModel.value);
  }
);
</script>

<template>
  <a-popconfirm
    title="Changing the model will remove the context, do you want to continue?"
    :open="visible"
    ok-text="Yes"
    cancel-text="No"
    @confirm="confirm"
    @cancel="cancel"
  >
    <a-select
      class="w-full mb-10"
      v-model:value="config.model"
      :options="modelOptions"
      @change="changeModel"
    />
  </a-popconfirm>
  <hr class="mb-10" />

  <h4 class="mb-10">{{ t('generic.parameters') }}</h4>
  <div class="row mb-10">
    <div class="col span-12">
      <SliderInput
        v-model="config.temperature"
        :min="0"
        :max="2"
        :interval="0.1"
        :label="t('chat.label.temperature')"
        :description="t('chat.parameterDesc.temperature')"
        @change="update"
      />
    </div>
  </div>

  <div class="row mb-10">
    <div class="col span-12">
      <SliderInput
        v-model="config.max_tokens"
        :min="0"
        :max="8192"
        :interval="1"
        :label="t('chat.label.maxTokens')"
        :description="t('chat.parameterDesc.max_tokens')"
        @change="update"
      />
    </div>
  </div>

  <div class="row mb-10">
    <div class="col span-12">
      <SliderInput
        v-model="config.top_p"
        :min="0"
        :max="1"
        :interval="0.1"
        :label="t('chat.label.topP')"
        :description="t('chat.parameterDesc.top_p')"
        @change="update"
      />
    </div>
  </div>

  <div class="row mb-10">
    <div class="col span-12">
      <LabeledInput
        v-model:value="config.seed"
        type="number"
        :tooltip="t('chat.parameterDesc.seed')"
        :label="t('chat.label.seed')"
        @change="update"
      />
    </div>
  </div>

  <div class="row mb-10">
    <div class="col span-12">
      <LabeledInput
        v-model:value="config.stop"
        type="number"
        :label="t('chat.label.stopSequence')"
        :tooltip="t('chat.parameterDesc.stop')"
        @change="update"
      />
    </div>
  </div>
</template>
