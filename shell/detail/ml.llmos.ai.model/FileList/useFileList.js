import { ref } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import { CSRF } from '@shell/config/cookies';

export const useFileList = ({ props = {}, emit }) => {
  const store = useStore();

  // const emit = defineEmits(["fetchFiles", "checked"]);

  const fileList = ref([]);
  const showModal = ref(false);
  const uploading = ref(false);
  const currentPath = ref('');
  // const maxConcurrent = ref(1);

  const prefixPath =
    props.resource.status.rootPath || props.resource.status.path;

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

                  const isUploaded = fileList.value.find(
                    (item) => item.destPath === eventData.destPath
                  );

                  if (!isUploaded) {
                    fileList.value.unshift(eventData);
                  } else {
                    const index = fileList.value.findIndex(
                      (item) => item.destPath === eventData.destPath
                    );

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

  const onUpload = async(options) => {
    showModal.value = true;

    const { file } = options;

    const destPath = currentPath.value ? 
      `${prefixPath}/${currentPath.value}/${file.name}` :
      `${prefixPath}/${file.name}`

    const fileInfo = {
      destPath,
      fileName: file.name,
      size: file.size,
      readSize: 0,
      totalSize: 100,
    };

    fileList.value.unshift(fileInfo);

    try {
      uploading.value = true;

      const formData = new FormData();

      formData.append('file', file);
      formData.append(
        'data',
        JSON.stringify({
          targetDirectory: currentPath.value,
          relativePath:    '',
        })
      );

      await uploadFile(formData);
      emit('fetchFiles');
    } catch (err) {
      message.error(`Upload Fail: ${ err }`);
    } finally {
      uploading.value = false;
    }
  };

  const onFolderUpload = async(options) => {
    showModal.value = true;

    const { file } = options;

    try {
      uploading.value = true;

      const relativePath = file.webkitRelativePath || '';
      const pathArray = relativePath.split('/');

      pathArray.pop();

      const formData = new FormData();

      formData.append('file', file);
      formData.append(
        'data',
        JSON.stringify({
          targetDirectory: currentPath.value,
          relativePaths:   pathArray,
        })
      );

      await uploadFile(formData);
      emit('fetchFiles');
    } catch (err) {
      message.error(`Upload Fail: ${ err }`);
    } finally {
      uploading.value = false;
    }
  };

  return {
    uploadFile,
    fileList,
    showModal,
    currentPath,
    uploading,
    onUpload,
    onFolderUpload,
  };
};
