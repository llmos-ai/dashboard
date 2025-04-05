<script setup>
import { computed, defineEmits, ref, watch } from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { ML_WORKLOAD_TYPES } from '@shell/config/types';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SliderInput from '@shell/components/SliderInput.vue';

const store = useStore();
const emits = defineEmits(['update:config', 'reset:messages']);

const props = defineProps({
  messages: {
    type:    Array,
    default: () => {
      return [];
    },
  },
  config: {
    type:    Object,
    default: () => {
      return {
        model:       '',
        temperature: 1,
        max_tokens:  2048,
        top_p:       1,
        seed:        null,
        stop:        null,
      };
    },
  }
});

const _config = ref(props.config);

watch(() => props.config, (neuValue) => {
  _config.value = neuValue;
}, { deep: true });
const currentModel = ref('');
const modelService = store.getters['cluster/all'](
  ML_WORKLOAD_TYPES.MODEL_SERVICE
);

const modelOptions = computed(() => {
  return modelService.map((model) => {
    return {
      label: model.spec.model,
      value: model.spec.model,
      model,
    };
  });
});

const update = () => {
  // TODO: enhance validation
  _config.value.seed = _config.value.seed ? Number(_config.value.seed) : null;
  _config.value.stop = _config.value.seed ? _config.value.stop : null;

  emits('update:config', _config);
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
  _config.value.model = previousModel.value;
  preventChangeModel.value = false;
};

const changeModel = (value, option) => {
  preventChangeModel.value = true;
  currentModel.value = value;
};

const previousModel = ref('');

watch(
  () => _config.value.model,
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
    emits('update:config', _config);
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
    <LabeledSelect
      v-model:value="_config.model"
      label="Model"
      :options="modelOptions"
      class="mb-10"
      @update:value="changeModel"
    />
  </a-popconfirm>
  <hr class="mb-10">

  <h4 class="mb-10">
    {{ t('generic.parameters') }}
  </h4>
  <div class="row mb-10">
    <div class="col span-12">
      <SliderInput
        v-model="_config.temperature"
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
        v-model="_config.max_tokens"
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
        v-model="_config.top_p"
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
        v-model:value="_config.seed"
        type="number"
        :tooltip="t('chat.parameterDesc.seed')"
        :label="t('chat.label.seed')"
        @update:value="update"
      />
    </div>
  </div>

  <div class="row mb-10">
    <div class="col span-12">
      <LabeledInput
        v-model:value="_config.stop"
        :label="t('chat.label.stopSequence')"
        :tooltip="t('chat.parameterDesc.stop')"
        @update:value="update"
      />
    </div>
  </div>
</template>
