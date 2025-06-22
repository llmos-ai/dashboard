import { ref } from 'vue';
import { useStore } from 'vuex';

import { CSRF } from '@shell/config/cookies';

export const useFileList = ({ props = {} }) => {
  const store = useStore();

  const percent = ref(0);
  const uploadStatus = ref('');
  const destPath = ref('');
  const fileList = ref([]);

  const uploadFile = (formData) => {
    return new Promise((resolve, reject) => {
      // 将异步逻辑包裹在独立async函数中
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

                  percent.value = Math.floor((eventData.readSize / eventData.totalSize) * 100);
                  uploadStatus.value = `正在上传: ${ eventData.destPath }`;
                  destPath.value = eventData.destPath;

                  const isUploaded = fileList.value.find((item) => item.destPath === eventData.destPath);

                  if (!isUploaded) {
                    fileList.value.push(eventData);
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

      // 执行异步处理函数
      processUpload();
    });
  };

  return {
    percent,
    uploadStatus,
    uploadFile,
    destPath,
    fileList,
  };
};
