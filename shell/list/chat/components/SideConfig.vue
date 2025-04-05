<script setup>
import { computed, watch, ref } from 'vue';
import { useStore } from 'vuex';
import StaticDrawer from '@shell/components/StaticDrawer.vue';
import ModelConfig from './ModelConfig.vue';
import SystemPrompt from '@shell/list/chat/components/SystemPrompt.vue';
const store = useStore();

defineProps({
  activeConfig: {
    type:    Object,
    default: () => {
      return {};
    }
  }
});

const drawerOpen = defineModel('drawerOpen', { type: Boolean });

const isChatType = computed(() => store.getters['chat/isChatType']);

const updateActiveConfig = (config) => {
  store.commit('chat/UPDATE_CHAT_CONFIG', {
    ...config,
    uuid: activeUUID.value
  });
};

const activeUUID = computed({
  get: () => store.state.chat.activeUUID,
  set: (value) => store.commit('chat/SET_ACTIVE_UUID', value)
});

const updateSystemPrompt = (content) => {
  store.commit('chat/UPDATE_SYSTEM_PROMPT', { content, key: activeUUID.value });
};

const compareChatIds = computed(() => {
  return store.getters['chat/compareChatIds'];
});

const chatsConfig = computed(() => store.state.chat.chatsConfig);

const activeSystemPrompt = ref('');

watch(() => ({
  uuid:     activeUUID.value,
  messages: store.getters['chat/chatMessages'](activeUUID.value),
}), () => {
  if (activeUUID.value) {
    activeSystemPrompt.value = store.getters['chat/chatMessages'](activeUUID.value)[0].content;
  }
}, { immediate: true });
</script>

<template>
  <StaticDrawer
    v-model:open="drawerOpen"
    class="w-[350px] flex-shrink-0"
  >
    <h2>{{ t('chat.modelSettings.label') }}</h2>

    <ModelConfig
      v-if="isChatType"
      :config="activeConfig"
      @update:config="updateActiveConfig"
    />

    <div v-else>
      <div>
        <a-space>
          <a-button
            v-for="(uuid) in compareChatIds"
            :key="uuid"
            :type="uuid === activeUUID ? 'primary' : 'default'"
            @click="() => activeUUID = uuid"
          >
            <span class="italic">#{{ chatsConfig[uuid].modelName }}</span>
          </a-button>
        </a-space>
        <a-divider />

        <SystemPrompt
          :key="activeUUID"
          :systemPrompt="activeSystemPrompt"
          @update:systemPrompt="updateSystemPrompt"
        />

        <ModelConfig
          :config="activeConfig"
          @update:config="updateActiveConfig"
        />
      </div>
    </div>
  </StaticDrawer>
</template>
