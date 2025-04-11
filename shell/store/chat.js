import { ModelParamConfig } from '@shell/config/constants';
import { v4 as uuidv4 } from 'uuid';
import cloneDeep from 'lodash/cloneDeep';

const initMessages = [{
  role:    'system',
  content: 'You are a helpful assistant.',
}];

export const state = () => {
  const firstUUID = uuidv4();
  const secondUUID = uuidv4();

  const compareConfigs = [{
    id:     firstUUID,
    config: { ...ModelParamConfig },
  }, {
    id:     secondUUID,
    config: { ...ModelParamConfig },
  }];

  return {
    chatType:              'chat',
    chatsCompletionChunks: {
      single:       { chat: cloneDeep(initMessages) },
      [firstUUID]:  { chat: cloneDeep(initMessages) },
      [secondUUID]: { chat: cloneDeep(initMessages) }
    },
    chatsConfig: {
      single:       { ...ModelParamConfig },
      [firstUUID]:  { ...ModelParamConfig },
      [secondUUID]: { ...ModelParamConfig },
    },
    singleChatConfig: { config: { ...ModelParamConfig }, messages: initMessages },
    compareConfigs,
    activeUUID:       'single',
  };
};

export const getters = {
  isChatType:   (state) => state.chatType === 'chat',
  chatMessages: (state) => (key = 'single') => {
    const _chat = state.chatsCompletionChunks[key];
    const _chatLength = _chat?.chat?.length;

    const all = _chat?.chat?.map((chat, index) => {
      const chatChunk = chat?.chunks || [];

      let reasoning = chat.reasoning;
      let content = chat.content;
      let finishReason = null;

      chatChunk?.forEach((chunk) => {
        if (chunk.choices?.[0]?.delta) {
          if (chunk.choices?.[0]?.delta?.reasoning_content) {
            reasoning += chunk.choices?.[0]?.delta?.reasoning_content || '';
          } else {
            content += chunk.choices?.[0]?.delta?.content || '';
          }
        }

        if (chunk.choices?.[0]?.finish_reason) {
          finishReason = chunk.choices?.[0]?.finish_reason;
        }
      });

      return {
        ...chat,
        content,
        reasoning,
        canRegenerate: (_chatLength - 1) === index || (_chatLength - 2) === index, // last role=assistant 、 last role=user
        isStop:        finishReason === 'stop' || _chat.chat?.length - 1 !== index || chat.abortFromUI,
      };
    }) || [];

    return all;
  },
  chatConfig: (state) => (key = 'single') => {
    return state.chatsConfig[key];
  },

  compareChatIds: (state) => {
    return Object.keys(state.chatsConfig).filter((key) => key !== 'single');
  },
};

export const mutations = {
  CHANGE_ACTIVE_UUID(state, uuid) {
    state.activeUUID = uuid;
  },

  PUSH_CHAT_COMPLETIONS_CHUNK(state, { type = 'single', chunk, addRole = false }) {
    const id = chunk?.id;
    const chat = state.chatsCompletionChunks?.[type]?.chat || '';
    const arrChunk = Array.isArray(chunk) ? chunk : [chunk];

    if (addRole) {
      if (chat) {
        state.chatsCompletionChunks[type]?.chat.push(...arrChunk);
      } else {
        state.chatsCompletionChunks[type] = { chat: arrChunk };
      }
    } else {
      if (!chat) {
        state.chatsCompletionChunks[type] = {
          chat: [{
            id:     chunk.id,
            chunks: [chunk],
            role:   'assistant', // default role, fetch from api
          }]
        };
      } else {
        // always push to last
        const chatLength = chat.length;

        const last = chat[chatLength - 1];

        if (last.role === 'assistant') {
          if (state.chatsCompletionChunks[type].chat[chatLength - 1].chunks) {
            state.chatsCompletionChunks[type].chat[chatLength - 1].chunks.push(...arrChunk);
          } else {
            state.chatsCompletionChunks[type].chat[chatLength - 1] = {
              id,
              chunks: [chunk],
              ...state.chatsCompletionChunks[type].chat[chatLength - 1]
            };
          }
        }
      }
    }
  },

  UPDATE_CHAT_CONFIG(state, config, key = 'single') {
    state.chatsConfig[key] = config;
  },

  SET_CHAT_TYPE(state, type) {
    state.chatType = type;
  },

  SET_SINGLE_CHAT_MESSAGES(state, messages) {
    state.singleChatConfig.messages = messages.map((item, index) => {
      return {
        ...item,
        loading: index === messages.length - 1
      };
    });
  },

  SET_ABORT_FROM_UI(state, uuid = 'single') {
    const chat = state.chatsCompletionChunks[uuid]?.chat;

    if (chat && chat.length > 0) {
      const lastMessage = chat[chat.length - 1];

      lastMessage.abortFromUI = true;
    }
  },

  UPDATE_SINGLE_CHAT_CONFIG(state, config) {
    state.singleChatConfig.config = config;
  },
  UPDATE_SYSTEM_PROMPT(state, { content, key = 'single' }) {
    const lastChat = state.chatsCompletionChunks[key].chat[0];

    lastChat.content = content;
  },
  UPDATE_COMPARE_CONFIGS(state, configs) {
    state.compareConfigs = configs;
  },

  UPDATE_COMPARE_MODEL_CONFIG(state, { uuid, config }) {
    const index = state.compareConfigs.findIndex((item) => item.id === uuid);

    if (index !== -1) {
      state.compareConfigs[index].config = config;
    }
  },

  REMOVE_COMPARE_MODEL(state, uuid) {
    state.compareConfigs = state.compareConfigs.filter((config) => config.id !== uuid);
    if (uuid) {
      delete state.chatsConfig[uuid];
    }

    if (state.activeUUID === uuid && state.compareConfigs.length > 0) {
      state.activeUUID = state.compareConfigs[0].id;
    }
  },

  CLEAR_CHAT_MESSAGES(state, uuid) {
    if (uuid) {
      state.chatsCompletionChunks[uuid].chat = cloneDeep(initMessages);
    }
  },

  UPDATE_COMPARE_SYSTEM_PROMPT(state, { uuid, content }) {
    const index = state.compareConfigs.findIndex((config) => config.id === uuid);

    if (index !== -1) {
      state.compareConfigs[index].messages = state.compareConfigs[index].messages.map(
        (item, idx) => idx === 0 ? { ...item, content } : item
      );
    }
  },
  UPDATE_COMPARE_MODEL_MESSAGES(state, { uuid, messages }) {
    const index = state.compareConfigs.findIndex((config) => config.id === uuid);

    if (index !== -1) {
      state.compareConfigs[index].messages = messages;
    }
  },

  ADD_COMPARE_MODEL(state) {
    const uuid = uuidv4();

    state.chatsCompletionChunks[uuid] = { chat: initMessages.concat() };
    state.chatsConfig[uuid] = { ...ModelParamConfig };
  },
  SET_ACTIVE_UUID(state, uuid) {
    state.activeUUID = uuid;
  },
};

export const actions = {
  REMOVE_COMPARE_MODEL({ state, getters, commit }, uuid) {
    state.compareConfigs = state.compareConfigs.filter((config) => config.id !== uuid);
    if (uuid) {
      delete state.chatsConfig[uuid];
    }

    if (state.activeUUID === uuid && getters.compareChatIds.length > 0) {
      commit('CHANGE_ACTIVE_UUID', getters.compareChatIds[0]);
    }
  },

  SET_SINGLE_MODEL_FROM_COMPARE({ state, commit }) {
    commit('SET_CHAT_TYPE', 'chat');
  },

  REGENERATE_MESSAGE({ state, commit }, payload = { key: 'single' }) {
    const { key, question } = payload;

    const chat = state.chatsCompletionChunks[key]?.chat;

    if (!chat || chat.length < 2) {
      return null;
    }

    const lastMessages = chat.slice(-2);
    const userMessage = lastMessages[0];

    if (userMessage.role !== 'user') {
      return null;
    }

    userMessage.content = question || userMessage.content;

    chat.pop();

    return userMessage.content;
  },
};
