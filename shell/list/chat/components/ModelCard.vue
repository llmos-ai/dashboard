<script setup>
import { ref, watch, useTemplateRef, nextTick, computed } from 'vue';
import useAutoScrollWithControl from '@shell/composables/useAutoScrollWithControl';
import useChat from '@shell/list/chat/composables/useChat';
import ModelConfig from '@shell/list/chat/components/ModelConfig.vue';
import StreamContent from '@shell/list/chat/components/StreamContent.vue';
import { matchModelString } from '@shell/utils/ai-model';
import { useModelLogo } from '../composables/useModelLogo';
const props = defineProps({
  actions: {
    type: Array,
    required: true,
  },

  config: {
    type: Object,
    default: () => ({}),
  },
  idx: {
    type: Number,
    default: 0,
  },
  question: {
    type: String,
    required: true,
  },
});

const scrollContainer = useTemplateRef('scrollContainer');
const observerTarget = useTemplateRef('observerTarget');

useAutoScrollWithControl(scrollContainer, observerTarget);

const config = ref(props.config);
const refQuestion = ref(props.question);
watch(
  () => props.question,
  () => {
    refQuestion.value = props.question;
  }
);
const url = ref('');
const { send, messages, loading, handleMessages } = useChat(
  url,
  config,
  refQuestion
);

const handleSend = (_question, fileList) => {
  console.log('🚀 ~ handleSend ~ _question:', _question);
  nextTick(() => {
    send(_question, fileList);
  });
};

defineExpose({
  handleSend,
});

const emit = defineEmits(['handle:action']);

const visible = ref(false);

const handleAction = (action, index) => {
  emit('handle:action', action, index);
};

const resetMessages = () => {
  handleMessages([]);
};

const model = ref('');
const modelDisplayName = computed(() => {
  return model.value.modelName || '';
});
const updateModel = (_model) => {
  url.value = _model.modelApi;
  model.value = _model;
};
const icon = computed(() => {
  return matchModelString(modelDisplayName.value);
});
const { modelLogo } = useModelLogo(icon);
const scHeight = ref(0);
</script>

<template>
  <a-card
    class="flex flex-col h-full"
    :bodyStyle="{
      flexGrow: 1,
      display: 'flex !important',
      flexDirection: 'column',
    }"
  >
    <template #title>
      <div class="flex justify-between align-center items-baseline">
        <span class="text-lg italic">
          <slot name="title"></slot>
        </span>
        <a-popover
          v-model:open="visible"
          :title="t('chat.model')"
          trigger="click"
          placement="bottom"
        >
          <a-button size="small" type="link" class="role-link !flex">
            <img class="size-[20px] mr-4" :src="modelLogo" />
            <span v-if="config.model">
              {{ modelDisplayName }}
            </span>
            <span v-else> 请选择您的模型 </span>
            <i class="ml-[2px] icon icon-chevron-down" />
          </a-button>

          <template #content>
            <div class="w-[350px]">
              <div class="row">
                <div class="col span-12">
                  <ModelConfig
                    v-model:config="config"
                    @update:model="updateModel"
                    :messages="messages"
                    @reset:messages="resetMessages"
                  />
                </div>
              </div>
            </div>
          </template>
        </a-popover>

        <span class="action">
          <a-dropdown trigger="click" placement="bottomRight">
            <a @click.prevent>
              <i class="icon icon-actions text-xl text-black mt-[4px]" />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item
                  v-for="item in props.actions"
                  :key="item.action"
                  @click="() => handleAction(item.action, idx)"
                >
                  {{ item.label }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </span>
      </div>
    </template>

    <div
      ref="scrollContainer"
      class="grow-1 overflow-y-auto"
      :style="{ height: scHeight + 'px' }"
    >
      <StreamContent
        v-for="(message, i) in messages"
        :key="i"
        :message="message"
        :showCard="false"
      />
      <div ref="observerTarget"></div>
    </div>
  </a-card>
</template>
