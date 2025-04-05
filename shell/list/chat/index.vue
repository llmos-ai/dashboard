<script setup>
import { useStore } from 'vuex';
import {
  ref, computed, useTemplateRef, watch, toValue
} from 'vue';

import { ML_WORKLOAD_TYPES } from '@shell/config/types';
import useAutoScrollWithControl from '@shell/composables/useAutoScrollWithControl';

import { matchModelString } from '@shell/utils/ai-model';

import ChatFlex from '@shell/components/ChatFlex.vue';
import Header from './components/Header/index.vue';
import ModelCard from './components/ModelCard.vue';
import ChatInput from './components/ChatInput.vue';
import StreamContent from './components/StreamContent.vue';
import useChat from './composables/useChat';

import SystemPrompt from '@shell/list/chat/components/SystemPrompt.vue';
import SideConfig from '@shell/list/chat/components/SideConfig.vue';
import cloneDeep from 'lodash/cloneDeep';

const store = useStore();
const loadFetch = async() => {
  await store.dispatch('cluster/findAll', { type: ML_WORKLOAD_TYPES.MODEL_SERVICE });
};

loadFetch();

const drawerOpen = ref(true);
const toggleDrawerOpen = (value) => {
  drawerOpen.value = value;
};

const isChatType = computed(() => store.getters['chat/isChatType']);

const singleChatMessages = computed(() => {
  return store.getters['chat/chatMessages']();
});

const url = ref('');
const question = ref('');

const modelComp = useTemplateRef('modelComp');

const { send, loading } = useChat(url, {
  messages: singleChatMessages,
  onUpdate: (chunk) => {
    store.commit('chat/PUSH_CHAT_COMPLETIONS_CHUNK', { chunk });
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
      type:    'single',
      addRole: true
    });
    options.body = JSON.stringify({
      ...toValue(options.body),
      messages: singleChatMessages.value.map(({ role, content }) => ({ role, content })).slice(0, -1)
    });

    return options;
  },
});

const filterSystemMessages = computed(() => {
  return singleChatMessages.value.filter((item) => item.role !== 'system');
});

const scrollContainer = useTemplateRef('scrollContainer');
const observerTarget = useTemplateRef('observerTarget');

// TODO: enhancement scroll
useAutoScrollWithControl(scrollContainer, observerTarget);

const openSystemPrompt = ref('');

const abortFetch = ref(null);
const submit = async(_question) => {
  question.value = '';

  if (isChatType.value) {
    abortFetch.value = await send({
      question: _question,
      config:   activeConfig.value,
    });
  } else {
    modelComp.value.map((comp) => {
      comp.handleSend({ question: _question });
    });
  }
};

const compareFetchLoading = computed(() => {
  const loadings = modelComp.value?.map((comp) => comp?.loading) || [];

  return loadings.every((item) => item === true) || false;
});

const model = ref('');

const updateModel = (resource) => {
  url.value = resource.modelApi;
  model.value = resource;
};

const icon = ref('');
const modelDisplayName = ref('');

watch(model, () => {
  if (model.value) {
    modelDisplayName.value = model.value.modelName;
    icon.value = matchModelString(modelDisplayName.value);
  }
}, { immediate: true, deep: true });

// multi chat
const chatsConfig = computed(() => store.state.chat.chatsConfig);
const addModel = () => {
  if (compareChatIds.value.length < 4) {
    store.commit('chat/ADD_COMPARE_MODEL');
  }
};

const activeUUID = computed({
  get: () => store.state.chat.activeUUID,
  set: (value) => store.commit('chat/SET_ACTIVE_UUID', value)
});

const updateModelMessages = (uuid, messages) => {
  store.commit('chat/UPDATE_MODEL_MESSAGES', { uuid, messages });
};

// active config
const activeConfig = ref({});

watch(activeUUID, () => {
  activeConfig.value = chatsConfig.value[activeUUID.value];
}, { immediate: true });

watch(isChatType, () => {
  if (!isChatType.value) {
    activeUUID.value = compareChatIds.value[0];
  } else {
    activeUUID.value = 'single';
  }
}, { immediate: true });

// active system prompt
const activeSystemPrompt = ref('');

watch(() => ({
  uuid:     activeUUID.value,
  messages: store.getters['chat/chatMessages'](activeUUID.value),
}), () => {
  if (activeUUID.value) {
    activeSystemPrompt.value = store.getters['chat/chatMessages'](activeUUID.value)[0].content;
  }
}, { immediate: true });

const updateSystemPrompt = (content) => {
  store.commit('chat/UPDATE_SYSTEM_PROMPT', { content, key: activeUUID.value });
};

const compareChatIds = computed(() => {
  return store.getters['chat/compareChatIds'];
});

const handleAction = (uuid, action) => {
  switch (action) {
  case 'singleModel':
    store.dispatch('chat/SET_SINGLE_MODEL_FROM_COMPARE');
    break;
  case 'remove':
    store.dispatch('chat/REMOVE_COMPARE_MODEL', uuid);
    break;
  case 'clear':
    store.commit('chat/CLEAR_CHAT_MESSAGES', uuid);
    break;
  default:
    break;
  }
};

const callbackAbortFetch = () => {
  if (isChatType.value) {
    abortFetch.value?.abort();
    store.commit('chat/SET_ABORT_FROM_UI');
  } else {
    modelComp.value.forEach((comp) => {
      comp.handleAbort();
      store.commit('chat/SET_ABORT_FROM_UI', comp.uuid);
    });
  }
};

const regenerate = async() => {
  const lastQuestion = await store.dispatch('chat/REGENERATE_MESSAGE');

  if (lastQuestion) {
    abortFetch.value = await send({
      question:     lastQuestion,
      config:       activeConfig.value,
      isRegenerate: true
    });
  }
};
</script>

<template>
  <Header
    :icon="icon"
    class="mb-10"
    :drawer-open="drawerOpen"
    @update:drawer="toggleDrawerOpen"
  >
    <template #extra>
      <a-button
        v-if="!isChatType"
        type="primary"
        size="large"
        @click="addModel"
      >
        + {{ t('chat.addModel') }}
      </a-button>
    </template>
  </Header>

  <div class="flex grow-1 border-t-1 border-gray-200">
    <div
      class="flex grow-1 flex-col flex-wrap px-5"
    >
      <a-collapse
        v-if="isChatType"
        v-model:activeKey="openSystemPrompt"
        class="w-full mt-10"
      >
        <a-collapse-panel
          key="1"
          :header="t('chat.label.systemPrompt')"
        >
          <SystemPrompt
            :systemPrompt="activeSystemPrompt"
            @update:systemPrompt="updateSystemPrompt"
          />
        </a-collapse-panel>
      </a-collapse>

      <a-row
        class="h-[300px] scroll-smooth flex grow-1 overflow-hidden my-5"
        justify="center"
      >
        <a-col
          v-if="isChatType"
          :md="22"
          :lg="22"
          :xl="18"
          :xxl="12"
          class="h-full"
        >
          <div class="overflow-y-scroll hide-scrollbar h-full">
            <ChatFlex>
              <StreamContent
                v-for="(message, i) in filterSystemMessages.slice().reverse()"
                :key="i"
                :message="message"
                :loading="message.isStop ? false : loading"
                @regenerate="regenerate"
              />
            </ChatFlex>
          </div>
        </a-col>

        <a-col
          v-else
          :lg="22"
          :xl="22"
          :xxl="22"
          class="h-full overflow-hidden"
        >
          <div class="h-full flex flex-row">
            <div class="h-full flex flex-col grow-1">
              <a-row
                :gutter="[16, 16]"
                class="flex-grow"
              >
                <a-col
                  v-for="(uuid, idx) in compareChatIds"
                  :key="uuid"
                  class="flex"
                  :span="12"
                >
                  <ModelCard
                    ref="modelComp"
                    :key="uuid"
                    :uuid="uuid"
                    :question="question"
                    @update:messages="updateModelMessages"
                    @handle:action="handleAction"
                  >
                    <template #title>
                      # {{ idx + 1 }}
                    </template>
                  </ModelCard>
                </a-col>
              </a-row>
            </div>
          </div>
        </a-col>
      </a-row>

      <ChatInput
        v-model="question"
        :loading="isChatType ?loading : compareFetchLoading"
        @submit="submit"
        @update:abort="callbackAbortFetch"
      />
    </div>

    <SideConfig
      v-model:drawerOpen="drawerOpen"
      :activeConfig="activeConfig"
    />
  </div>
</template>
