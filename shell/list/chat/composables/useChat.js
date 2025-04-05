import { ref, toValue } from 'vue';
import { notification } from 'ant-design-vue';
import { fetchLLMStream } from '@shell/utils/stream';
export default function useChat(url, _options = {}) {
  const defaultOptions = {
    formatMessage: (messages) => messages.map(({ role, content }) => ({ role, content })),
    messages:      ref([]),
    onUpdate:      () => {},
    beforeFetch:   () => {},
  };

  const options = { ...defaultOptions, ..._options };
  const {
    messages, formatMessage, onUpdate, beforeFetch
  } = options;

  const loading = ref(false);

  const send = async(sOptions = { config: {}, question: '' }) => {
    loading.value = true;
    const controller = new AbortController();
    const finalSignal = options.signal || controller.signal;

    try {
      fetchLLMStream({
        url:  'https://api.deepseek.com/v1/chat/completions',
        body: {
          ...sOptions.config,
          messages: formatMessage(toValue(messages)),
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization:  'Bearer sk-6070b868bc004dc6a54057b597895431'
        },
        beforeFetch,
        onError,
        onData,
        onDone,
        payload: { ...sOptions },
        signal:  finalSignal,
      }).then((result) => result);
    } catch (error) {
      onError(error);
    }

    return controller;
  };

  const onError = (error) => {
    notification.error({
      message:     'Error',
      description: error,
    });
    loading.value = false;
  };

  const onData = (chunk) => {
    onUpdate(chunk);
  };

  const onDone = () => {
    loading.value = false;
  };

  return {
    loading,
    send,
  };
}
