<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useModelLogo } from '../composables/useModelLogo';
import { useI18n } from '@shell/composables/useI18n';

import ModelConfig from './ModelConfig.vue';

const { t } = useI18n(useStore());

const props = defineProps({
  name: { type: String, default: '' },
  icon: { type: String, default: '' },
});
const emits = defineEmits('update:model');
const config = defineModel('config');
const { modelLogo } = useModelLogo(() => props.icon);

const open = ref(false);

const toggleDrawer = () => {
  open.value = !open.value;
};

const updateModel = (_model) => {
  console.log('🚀 ~ updateModel ~ _model:', _model);
  emits('update:model', _model);
};
</script>

<template>
  <a-card
    class="mt-10"
    :bodyStyle="{
      padding: '10px',
    }"
  >
    <div class="h-[40px] flex justify-between items-center">
      <div class="flex items-center">
        <img class="size-[30px] mr-4" :src="modelLogo" />
        <span class="text-lg font-bold">{{ props.name }}</span>
      </div>

      <a-button
        type="link"
        size="small"
        class="role-link"
        @click="toggleDrawer"
      >
        <i class="icon icon-lg icon-gear" />
      </a-button>

      <a-drawer
        :title="t('chat.model')"
        placement="right"
        :closable="false"
        :open="open"
        @close="toggleDrawer"
      >
        <ModelConfig v-model:config="config" @update:model="updateModel" />
      </a-drawer>
    </div>
  </a-card>
</template>
