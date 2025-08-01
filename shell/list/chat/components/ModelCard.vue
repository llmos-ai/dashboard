<script setup>
import {
  ref, nextTick, computed, watch, toValue
} from 'vue';
import { SwapOutlined } from '@ant-design/icons-vue';
import AutoScrollBox from '@shell/components/AutoScrollBox.vue';
import useChat from '@shell/list/chat/composables/useChat';
import StreamContent from '@shell/list/chat/components/StreamContent.vue';
import { matchModelString } from '@shell/utils/ai-model';
import { useModelLogo } from '../composables/useModelLogo';
import { useStore } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import SelectModel from '@shell/list/chat/components/SelectModel.vue';

const store = useStore();
const props = defineProps({
  uuid: {
    type:     String,
    required: true,
  },
  question: {
    type:     String,
    required: true,
  },
});

const actions = [
  {
    label:  '单一模型进行调试',
    action: 'singleModel',
  },
  {
    label:  '清除历史消息',
    action: 'clear',
  },
  {
    label:  '移除',
    action: 'remove',
  },
];
const config = ref({});

// 监听 UUID 变化，更新配置
watch(() => props.uuid, () => {
  config.value = store.state.chat.chatsConfig[props.uuid];
}, { immediate: true });

const url = ref('');
const { send, loading } = useChat(url, {
  messages: [],
  onUpdate: (chunk) => {
    store.commit('chat/PUSH_CHAT_COMPLETIONS_CHUNK', { chunk, type: props.uuid });
  },

  beforeFetch: (options) => {
    const assistantRole = cloneDeep({
      role:      'assistant',
      content:   '',
      reasoning: '',
    });
    const userRole = cloneDeep(
      {
        role:    'user',
        content: options.payload.question,
      }
    );
    const isRegenerate = options?.payload?.isRegenerate;

    store.commit('chat/PUSH_CHAT_COMPLETIONS_CHUNK', {
      chunk:   isRegenerate ? assistantRole : [userRole, assistantRole],
      type:    props.uuid,
      addRole: true
    });

    const messages = store.getters['chat/chatMessages'](props.uuid);

    options.body = JSON.stringify({
      ...toValue(options.body),
      messages: messages.map(({ role, content }) => ({ role, content })).slice(0, -1)
    });

    return options;
  },
});

const abortFetch = ref(null);
const handleSend = (options = {}) => {
  nextTick(async() => {
    abortFetch.value = await send({
      ...options,
      config: toValue(config),
    });
  });
};

const handleAbort = () => {
  if (abortFetch.value) {
    abortFetch.value?.abort();
  }
};

defineExpose({
  handleSend, handleAbort, loading, uuid: props.uuid
});

const filterSystemMessages = computed(() => {
  const messages = store.getters['chat/chatMessages'](props.uuid);

  return messages.filter((item) => item.role !== 'system');
});

const emit = defineEmits(['handle:action']);
const visible = ref(false);

const handleAction = (action) => {
  emit('handle:action', props.uuid, action);
};

const modelDisplayName = computed(() => {
  return modelResource.value?.modelName || config.value.model;
});

// TODO: high,  url save to vuex
const modelResource = ref(null);
const changeModel = (resource) => {
  config.value.model = resource.spec.model;
  modelResource.value = resource;
  url.value = resource.modelApi;
  store.commit('chat/UPDATE_COMPARE_MODEL_CONFIG', {
    uuid:   props.uuid,
    config: {
      ...config.value,
      model: resource.spec.model
    }
  });
};

const icon = computed(() => matchModelString(modelDisplayName.value));
const { modelLogo } = useModelLogo(icon);
const scHeight = ref(0);

const regenerate = async() => {
  const lastQuestion = await store.dispatch('chat/REGENERATE_MESSAGE', { key: props.uuid });

  if (lastQuestion) {
    abortFetch.value = await send({
      question:     lastQuestion,
      config:       toValue(config),
      isRegenerate: true
    });
  }
};
</script>

<script>
export default {
  setup() {

  }
};
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
          <slot name="title" />
        </span>

        <a-popover
          v-model:open="visible"
          :title="t('chat.model')"
          trigger="click"
          placement="bottom"
        >
          <a-button
            size="small"
            type="link"
            class="role-link !flex"
          >
            <img
              class="size-[20px] mr-2"
              :src="modelLogo"
            >
            <span v-if="config.model">
              {{ modelDisplayName }}
            </span>
            <span v-else> {{ t('chat.selectModel') }} </span>
            <SwapOutlined />
          </a-button>

          <template #content>
            <div class="w-[350px]">
              <div class="row">
                <div class="col span-12">
                  <SelectModel
                    :model="config.model"
                    class="mb-10"
                    @update:value="changeModel"
                  />
                </div>
              </div>
            </div>
          </template>
        </a-popover>

        <span class="action">
          <a-dropdown
            trigger="click"
            placement="bottomRight"
          >
            <a @click.prevent>
              <i class="icon icon-actions text-xl text-black mt-[4px]" />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item
                  v-for="item in actions"
                  :key="item.action"
                  @click="() => handleAction(item.action)"
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
      <AutoScrollBox>
        <StreamContent
          v-for="(message, i) in filterSystemMessages"
          :key="i"
          :message="message"
          :loading="message.isStop ? false : loading"
          :uuid="props.uuid"
          @regenerate="regenerate"
        />
      </AutoScrollBox>
    </div>
  </a-card>
</template>
