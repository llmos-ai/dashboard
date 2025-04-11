<script setup>
import { useStore } from 'vuex';
import { computed, defineEmits, ref, watch } from 'vue';

import LabeledInput from '@shell/components/form/LabeledInput/LabeledInput.vue';
import SliderInput from '@shell/components/SliderInput.vue';
import SelectModel from '@shell/list/chat/components/SelectModel.vue';

const store = useStore();
const emits = defineEmits(['update:config', 'reset:messages']);

const props = defineProps({
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
  },
  uuid: {
    type:    String,
    default: '',
  },
});

const messages = computed(() => {
  // filter role:system, it don't show in chat window
  return store.getters['chat/chatMessages'](props.uuid).filter((chat) => chat.role !== 'system');
});
const needClear = computed(() => messages.value.length > 0);

const _config = ref(props.config);

watch(() => props.config, (neuValue) => {
  _config.value = neuValue;
}, { deep: true });

const update = () => {
  _config.value.seed = _config.value.seed ? Number(_config.value.seed) : null;
  _config.value.stop = _config.value.seed ? _config.value.stop : null;

  emits('update:config', _config.value);
};

// 是否显示模型切换弹窗
const visible = ref(false);
const preventChangeModel = ref(false);
const currentModelResource = ref(null);

const clearMessages = () => {
  store.commit('chat/CLEAR_CHAT_MESSAGES', props.uuid);
  visible.value = false;
};

const cancel = () => {
  visible.value = false;
  _config.value.model = previousModelResource.value.spec.model;
  currentModelResource.value = previousModelResource.value;

  preventChangeModel.value = false;
};

const changeModel = (value) => {
  _config.value.model = value.spec.model;

  previousModelResource.value = currentModelResource.value;
  currentModelResource.value = value;

  preventChangeModel.value = true;
};

const previousModelResource = ref('');

watch(
  () => _config.value.model,
  (newValue, oldValue) => {
    if (newValue !== oldValue && oldValue && needClear.value && preventChangeModel.value) {
      visible.value = true;
    }

    emits('update:config', _config.value);
    if (currentModelResource.value) {
      emits('update:model', currentModelResource.value);
    }
  }
);
</script>

<script>
export default {
    setup() {
        return
    }
}
</script>


<template>
  <a-popconfirm
    :title="t('chat.switchTip')"
    :open="visible"
    :ok-text="t('generic.yes')"
    :cancel-text="t('generic.no')"
    @confirm="clearMessages"
    @cancel="cancel"
  >
    <SelectModel
      :model="_config.model"
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
