import { ref, reactive, computed, watch, toValue, toRaw } from 'vue';
import { notification } from 'ant-design-vue';
import { fetchLLMStream } from '@shell/utils/stream';

export default function useChat(url, postBody, question) {
  let bodyMessage = [];
  const messages = reactive([]);
  const loading = ref(false);

  const send = async (question, fileList) => {
    onBefore(question, toValue(fileList));
    await fetchLLMStream({
      url: toValue(url),
      body: {
        ...postBody.value,
        messages: bodyMessage,
      },
      onError,
      onData,
      onDone,
    });
  };

  const onBefore = (question, fileList) => {
    if (messages[messages.length - 1]?.role !== 'user') {
      if (fileList && fileList.length) {
        fileList.forEach((file) => {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: file.base64,
                },
              },
            ],
          });
        });
      }
      messages.push({
        role: 'user',
        content: question,
      });
    } else {
      messages[messages.length - 1].content = text;
    }

    bodyMessage = transformMessages(messages);

    if (messages[messages.length - 1]?.role !== 'assistant') {
      messages.push({
        role: 'assistant',
        content: '',
        reasoningContent: '',
      });
    }

    loading.value = true;
  };

  const onError = (error) => {
    // TODO: 错误的时候需要处理message
    // TODO: add element target
    notification.error({
      message: 'Error',
      description: error,
    });
    loading.value = false;
  };

  const onData = (suffix, hasThink = false) => {
    const lastMessage = messages[messages.length - 1];

    if (hasThink) {
      if (lastMessage.reasoningContent) {
        const reasoningContent = lastMessage.reasoningContent + suffix;
        lastMessage.reasoningContent = reasoningContent;
      } else {
        lastMessage.reasoningContent = suffix;
      }
    } else {
      const content = lastMessage.content + suffix;
      lastMessage.content = content;
    }
  };

  const onDone = () => {
    loading.value = false;
  };

  const handleMessages = (value) => {
    messages.length = 0;
  };

  return {
    messages,
    loading,
    send,
    handleMessages,
  };
}

// transform UI message to bodyMessage
function transformMessages(messages) {
  // delete reasoningContent
  const copyMessage = [...toRaw(messages)];

  return copyMessage.map((message) => {
    return {
      role: message.role,
      content: message.content,
    };
  });
}
