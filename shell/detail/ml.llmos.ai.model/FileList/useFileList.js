import { ref } from 'vue';
import { useStore } from 'vuex';

import { CSRF } from '@shell/config/cookies';

export const useFileList = ({ props = {} }) => {
  const store = useStore();

  const fileList = ref([]);
  const maxConcurrent = ref(1);

  const uploadFile = (formData) => {
    return new Promise((resolve, reject) => {
      const processUpload = async() => {
        try {
          const csrf = store.$cookies.get(CSRF, { parseJSON: false });

          const res = await fetch(props.resource.actions.upload, {
            method:  'POST',
            headers: {
              Accept:       'text/event-stream',
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

                  const isUploaded = fileList.value.find((item) => item.destPath === eventData.destPath);

                  if (!isUploaded) {
                    fileList.value.unshift(eventData);
                  } else {
                    const index = fileList.value.findIndex((item) => item.destPath === eventData.destPath);

                    fileList.value[index] = eventData;
                  }
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to parse SSE data:', e);
                }
              }
            }
          }
        } catch (error) {
          reject(error);
        }
      };

      processUpload();
    });
  };

  return {
    uploadFile,
    fileList,
  };
};
