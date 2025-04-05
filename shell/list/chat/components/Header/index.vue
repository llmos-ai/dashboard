<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ButtonGroup from '@/shell/components/ButtonGroup.vue';
import { useModelLogo } from '../../composables/useModelLogo';

const props = defineProps({
  icon: {
    type:     String,
    required: true,
  },
  drawerOpen: {
    type:    Boolean,
    default: true,
  }
});

const emits = defineEmits(['update:drawer']);

const store = useStore();
const { t } = useI18n(store);

const { modelLogo } = useModelLogo(() => props.icon);

const options = [
  {
    label: t('chat.type.chat'),
    value: 'chat',
  },
  {
    label: t('chat.type.compare'),
    value: 'compare',
  },
];

const isChatType = computed(() => store.getters['chat/isChatType']);
const chatType = computed({
  get: () => store.state.chat.chatType,
  set: (value) => store.commit('chat/SET_CHAT_TYPE', value)
});

const toggleDrawer = () => {
  emits('update:drawer', !props.drawerOpen);
};
</script>

<template>
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-x-5">
      <h1 class="mb-0">
        {{ t("chat.type.chat") }}
      </h1>

      <img
        v-if="isChatType"
        class="size-[30px]"
        :src="modelLogo"
      >
    </div>

    <div class="flex items-center gap-x-5">
      <slot name="extra" />
      <ButtonGroup
        v-model:value="chatType"
        :options="options"
      />
      <a-button
        type="link"
        @click="toggleDrawer"
      >
        <i class="icon icon-lg icon-gear" />
      </a-button>
    </div>
  </div>
</template>
