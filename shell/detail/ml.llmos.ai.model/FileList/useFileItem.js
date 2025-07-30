import { computed } from 'vue';
import { useStore } from 'vuex';

import { _VIEW } from '@shell/config/query-params';
import { useFileList } from '@shell/detail/ml.llmos.ai.model/FileList/useFileList';

export const useFileItem = ({ props = {}, emit }) => {
  const store = useStore();

  const { isFile, currentPath, file = {} } = props;

  const { generatePresignedURL } = useFileList({
    props: { resource: props.resource },
    emit,
  });

  const currentFolder = computed(() => {
    if (isFile.value) {
      return currentPath.value.split('/').slice(0, -1).join('/');
    } else {
      return currentPath.value.split('/').slice(0, -2).join('/');
    }
  });

  const fileName = computed(() => {
    return file.name || file.Name;
  });

  const fileType = computed(() => {
    return fileName.value.split('.').pop();
  });

  const onRowClick = async() => {
    if (isFile.value) {
      store.dispatch('cluster/promptModal', {
        component:      'TextViewerModal',
        modalWidth:     '85%',
        componentProps: {
          contentFunc: async() => {
            const previewUrl = await generatePresignedURL({
              operation:      'download',
              targetFilePath: currentPath.value,
              fileName:       fileName.value,
            });

            const res = await fetch(previewUrl.presignedURL);
            const out = await res.text();

            return out;
          },
          fileType: fileType.value,
          readOnly: true,
          mode:     _VIEW,
          title:    fileName.value,
        },
      });
    } else {
      emit('fetchFiles', currentPath.value);
    }
  };

  return {
    currentFolder,
    onRowClick,
  };
};
