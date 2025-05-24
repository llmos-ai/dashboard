import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { CSRF } from '@shell/config/cookies';

export const useFileList = ({
  props = {},
}) => {
  const store = useStore();

  const percent = ref(0);
  const uploadStatus = ref('');

  const uploadFile = (formData) => {
    return new Promise(async(resolve, reject) => {
      try {
        const csrf = store.$cookies.get(CSRF, { parseJSON: false })

        const res = await fetch(props.resource.actions.upload, {
          method: 'POST',
          headers: {
            'Accept': 'text/event-stream',
            'x-api-csrf': csrf,
          },
          body: formData,
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            resolve(true);
            break;
          }

          const chunk = decoder.decode(value);
          
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const eventData = JSON.parse(line.slice(5));
                percent.value = Math.floor((eventData.readSize / eventData.totalSize) * 100);
                uploadStatus.value = `正在上传: ${ eventData.destPath }`;
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    percent,
    uploadStatus,
    uploadFile,
  };
};