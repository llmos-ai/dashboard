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
  const csrf = store.$cookies.get(CSRF, { parseJSON: false });

  const generatePresignedURL = async({
    fileName,
    targetDirectory,
  }) => {
    const objectName = targetDirectory ? `${ targetDirectory }/${ fileName }` : fileName;

    return await props.resource.doAction('generatePresignedURL', {
      objectName,
      operation: 'upload',
    });
  };

  const uploadS3 = async({
    presignedURL,
    file,
    destPath,
  }) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const uploadedBytes = event.loaded;
          const totalBytes = event.total;
          const progress = Math.round((uploadedBytes / totalBytes) * 100);

          // 更新进度信息
          const index = fileList.value.findIndex(
            (item) => item.destPath === destPath
          );

          if (index !== -1) {
            fileList.value[index] = {
              ...fileList.value[index],
              readSize:  uploadedBytes,
              totalSize: totalBytes,
              progress,
              status:    'uploading'
            };
          }
        }
      });

      // 监听上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 上传成功，更新最终状态
          const index = fileList.value.findIndex(
            (item) => item.destPath === destPath
          );

          if (index !== -1) {
            fileList.value[index] = {
              ...fileList.value[index],
              progress: 100,
              status:   'completed'
            };
          }

          resolve(xhr);
        } else {
          reject(new Error(`Upload failed: ${ xhr.status } ${ xhr.statusText }`));
        }
      });

      // 监听上传错误
      xhr.addEventListener('error', () => {
        const index = fileList.value.findIndex(
          (item) => item.destPath === destPath
        );

        if (index !== -1) {
          fileList.value[index] = {
            ...fileList.value[index],
            status: 'error',
            error:  'Upload failed'
          };
        }

        reject(new Error('Upload failed'));
      });

      // 监听上传中断
      xhr.addEventListener('abort', () => {
        const index = fileList.value.findIndex(
          (item) => item.destPath === destPath
        );

        if (index !== -1) {
          fileList.value[index] = {
            ...fileList.value[index],
            status: 'error',
            error:  'Upload aborted'
          };
        }

        reject(new Error('Upload aborted'));
      });

      // 开始上传
      xhr.open('PUT', presignedURL);
      xhr.setRequestHeader('x-api-csrf', csrf);
      xhr.send(file);
    });
  };

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

    const { file = {} } = options;

    const { webkitRelativePath = '' } = file;
    const relativePath = webkitRelativePath.replace(file.name, '');

    const destPath = currentPath.value ? `${ prefixPath }/${ currentPath.value }/${ file.name }` : `${ prefixPath }/${ file.name }`;

    const fileInfo = {
      destPath,
      fileName:  file.name,
      size:      file.size,
      readSize:  0,
      totalSize: file.size,
      progress:  0,
      status:    'pending'
    };

    fileList.value.unshift(fileInfo);

    try {
      uploading.value = true;

      // 更新状态为准备中
      const index = fileList.value.findIndex(
        (item) => item.destPath === destPath
      );

      if (index !== -1) {
        fileList.value[index] = {
          ...fileList.value[index],
          status: 'preparing'
        };
      }

      const res = await generatePresignedURL({
        fileName:        file.name,
        targetDirectory: currentPath.value ? `${ currentPath.value }/${ relativePath }` : relativePath,
      });

      const presignedURL = res.presignedURL;

      // 更新状态为开始上传
      if (index !== -1) {
        fileList.value[index] = {
          ...fileList.value[index],
          status: 'uploading'
        };
      }

      await uploadS3({
        presignedURL,
        file,
        destPath,
      });
    } catch (err) {
      message.error(`Upload Fail: ${ err }`);

      // 更新失败状态
      const index = fileList.value.findIndex(
        (item) => item.destPath === destPath
      );

      if (index !== -1) {
        fileList.value[index] = {
          ...fileList.value[index],
          status: 'error',
          error:  err.message
        };
      }
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
  };
};
