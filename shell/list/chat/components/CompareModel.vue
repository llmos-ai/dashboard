<script setup>
import { reactive, useTemplateRef, watch } from 'vue';

import { ModelParamConfig } from '@shell/config/constants';
import ModelCard from './ModelCard.vue';

const props = defineProps({
  question: {
    type:     String,
    required: true,
  },
});

const configs = reactive([
  { ...ModelParamConfig },
  { ...ModelParamConfig },
]);
const modelCompsRef = useTemplateRef('modelComp');

const addModel = () => {
  if (configs.length < 4) {
    configs.push(ModelParamConfig);
  }
};

const handleSend = async(_question, fileList) => {
  modelCompsRef.value.forEach((item) => {
    item.handleSend(_question, fileList);
  });
};

defineExpose({ handleSend });

const actions = [
  {
    label:  '单一模型进行调试',
    action: 'singleModel',
  },
  {
    label:  '移除',
    action: 'remove',
  },
];

const remove = (idx) => {
  //  TODO
  configs.splice(idx, 1);
};

const singleModel = (idx) => {
  // TODO
};

const handleAction = (action, index) => {
  const actionsMap = {
    singleModel,
    remove,
  };

  return actionsMap[action](index);
};
</script>

<template>
  <div class="h-full flex flex-col">
    <a-row>
      <a-col :span="24">
        <a-button
          type="link"
          class="role-link float-right"
          @click="addModel"
        >
          + {{ t('chat.addModel') }} ({{ configs.length }} / 4)
        </a-button>
      </a-col>
    </a-row>

    <a-row
      :gutter="[16, 16]"
      class="flex-grow"
    >
      <a-col
        v-for="(config, idx) in configs"
        :key="idx"
        class="flex"
        :span="12"
      >
        <ModelCard
          ref="modelComp"
          :idx="idx"
          :config="config"
          :actions="actions"
          :question="props.question"
          @handle:action="handleAction"
        >
          <template #title>
            # {{ idx + 1 }}
          </template>
        </ModelCard>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.role-link {
  min-height: 22px !important;

  &:hover {
    background-color: var(--accent-btn);
    box-shadow: none;
  }
}
</style>
