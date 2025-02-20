<script>
import { modelStreamJson } from '@shell/utils/stream';

import Header from './component/header.vue';
import ModelDescription from './component/ModelDescription.vue';
import ModelConfig from './component/ModelConfig.vue';
import CompareModel from './component/CompareModel.vue';
import ChatInput from './component/ChatInput.vue';

import StreamContent from '@shell/components/StreamContent.vue';

export default {
  components: {
    ChatInput, Header, StreamContent, ModelDescription, ModelConfig, CompareModel,
  },

  data() {
    const chatTypeOptions = [
      {
        label: '对话',
        value: 'chat',
      },
      {
        label: '模型比较',
        value: 'compare',
      },
    ];

    const modalOptions = [
      {
        label: 'deepseek-r1',
        value: 'deepseek-r1',
      },
      {
        label: 'chatgpt-01',
        value: 'chatgpt-01',
      },
      {
        label: 'deepseek-r2',
        value: 'deepseek-r2',
      }
    ];

    return {
      postBody: {
        model:            'deepseek-chat',
        thinking_enabled: true,
        stream:           true,
        stream_options:   { include_usage: true },
        temperature:      1,
        top_p:            1,
        seed:             null,
      },
      messages:  [],
      chatTypeOptions,
      chatType:  'compare',
      direction: 'rtl',
      modalName: 'deepseek',
      modalOptions,
      config:    {
        seed:        null,
        stop:        null,
        temperature: 1,
        top_p:       1,
        max_tokens:  4090
      },
      question:  '',
      isLoading: false
    };
  },

  computed: {
    isChatType() {
      return this.chatType === 'chat';
    }
  },

  methods: {
    changeChatType(value) {
      this.chatType = value;
    },

    async fetchStreamData(prefixCallback, callback, endCallback) {
      const jsonString = JSON.stringify({
        ...this.postBody,
        messages: this.messages
      });

      if (prefixCallback) {
        prefixCallback();
      }

      const response = await modelStreamJson('https://api.deepseek.com/chat/completions', {
        method:  'POST',
        headers: {
          Authorization:  'Bearer sk-6070b868bc004dc6a54057b597895431',
          'Content-Type': 'application/json',
        },
        body: jsonString,
      }).finally(() => {
        endCallback();
      });

      const reader = response;
      const decoder = new TextDecoder();

      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();

        done = readerDone;

        const text = decoder.decode(value, { stream: true });

        const lines = text.split('\n');

        for (const line of lines) {
          try {
            const cleanedLine = line.replace(/^data: /, '');
            const parsed = JSON.parse(cleanedLine);
            const content = parsed.choices[0]?.delta?.content;

            if (content) {
              callback(content);
            }
          } catch (error) {
          }
        }
      }
    },

    send(question) {
      this.isLoading = true;

      this.messages.push({
        role:    'user',
        content: question
      });
      this.question = '';
      this.fetchStreamData(this.prefixCallback, this.callback, this.endCallback);
    },

    prefixCallback() {
      this.messages.push({
        role:    'assistant',
        content: ''
      });
    },
    callback(suffix) {
      const lastMessage = this.messages[this.messages.length - 1];
      const content = lastMessage.content + suffix;

      this.messages.splice(this.messages.length - 1, 1, {
        role: 'assistant',
        content
      });
    },
    endCallback() {
      this.isLoading = false;
    },

    showConfigDialog() {
      this.$refs.modalRef.show();
    },

    changeConfig(value) {
      this.postBody = JSON.stringify(value);
    },

    changeQuestion(text) {
      console.log('🚀 ~ changeQuestion ~ text:', text);
      this.question = text;
    }
  },
};
</script>

<template>
  <div class="wrapper">
    <Header
      :option="chatType"
      @changeChatType="changeChatType"
    />

    <div
      v-if="isChatType"
      class="chat-stream"
    >
      <ModelDescription
        @showConfigDialog="showConfigDialog"
      />

      <div
        v-for="message in messages"
        :key="message.content"
      >
        <StreamContent
          :message="message"
        />
      </div>
    </div>

    <div
      v-else
      class="chat-stream"
    >
      <CompareModel />
    </div>

    <div class="footer">
      <ChatInput
        class="mb-10"
        :text="question"
        :loading="isLoading"
        @handleQuestion="send"
        @input="changeQuestion"
      />
      <p class="text-center">
        试用体验内容均由人工智能模型生成，不代表平台立场{{ question }}
      </p>
    </div>

    <ModelConfig
      ref="modalRef"
      :config="config"
      @changeConfig="changeConfig"
    />
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
    overflow: hidden;
    flex-direction: column;
    flex-grow: 1;
    height: calc(300px);
    scroll-behavior: smooth;
      scrollbar-width: none;
      overflow-y: scroll;
  }
}
</style>
