<script setup>
import { useStore } from 'vuex';
import { ref, computed, useTemplateRef, watch } from 'vue';

import { ML_WORKLOAD_TYPES } from '@shell/config/types';
import useAutoScrollWithControl from '@shell/composables/useAutoScrollWithControl';

import { ModelParamConfig } from '@shell/config/constants';
import { matchModelString } from '@shell/utils/ai-model';

import ChatFlex from '@shell/components/ChatFlex.vue';
import Header from './components/header.vue';
import ModelDescription from './components/ModelDescription.vue';
import CompareModel from './components/CompareModel.vue';
import ChatInput from './components/ChatInput.vue';
import StreamContent from './components/StreamContent.vue';
import useChat from './composables/useChat';

const store = useStore();

const loadFetch = async() => {
  await store.dispatch('cluster/findAll', { type: ML_WORKLOAD_TYPES.MODEL_SERVICE });
};

loadFetch();

const config = ref({ ...ModelParamConfig });

const url = ref('');
const question = ref('');
const copyQuestion = ref('');

const chatType = ref('chat');
const isChatType = computed(() => chatType.value === 'chat');

const compareRef = useTemplateRef('compareRef');

const { send, messages, loading } = useChat(url, config, copyQuestion);

const scrollContainer = useTemplateRef('scrollContainer');
const observerTarget = useTemplateRef('observerTarget');

// TODO: enhancement scroll
useAutoScrollWithControl(scrollContainer, observerTarget);

const submit = (_question, fileList) => {
  // We should copy the value of question, because ChatInput needs to be empty.
  copyQuestion.value = question.value;
  question.value = '';

  if (isChatType.value) {
    send(_question, fileList);
  } else {
    compareRef.value.handleSend(_question, fileList);
  }
};

const model = ref('');
const updateModel = (_model) => {
  url.value = _model.modelApi;
  model.value = _model;
};

const icon = ref('');
const modelDisplayName = ref('');

watch(model, () => {
  if (model.value) {
    modelDisplayName.value = model.value.modelName;
    icon.value = matchModelString(modelDisplayName.value);
  }
});
</script>

<template>
  <Header v-model:type="chatType" />

  <div class="wrapper">
    <ModelDescription
      v-if="isChatType"
      v-model:config="config"
      :name="modelDisplayName"
      :icon="icon"
      @update:model="updateModel"
    />

    <a-row
      class="chat-stream mb-10"
      justify="center"
    >
      <a-col
        v-if="isChatType"
        :md="22"
        :lg="20"
        :xl="16"
        :xxl="12"
        class="h-full"
      >
        <div class="overflow-y-scroll hide-scrollbar h-full">
          <ChatFlex>
            <StreamContent
              v-for="(message, i) in messages.slice().reverse()"
              :key="i"
              :message="message"
            />
          </ChatFlex>
        </div>
      </a-col>

      <a-col
        v-else
        :md="22"
        :lg="22"
        :xl="22"
        :xxl="18"
        class="h-full overflow-hidden"
      >
        <CompareModel
          ref="compareRef"
          :question="copyQuestion"
        />
      </a-col>
    </a-row>

    <div class="footer">
      <ChatInput
        v-model="question"
        :loading="loading"
        @submit="submit"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  flex-grow: 1;

  .chat-stream {
    display: flex;
    flex-grow: 1;
    height: calc(300px);
    scroll-behavior: smooth;
    overflow: hiddle;
  }
}
</style>
