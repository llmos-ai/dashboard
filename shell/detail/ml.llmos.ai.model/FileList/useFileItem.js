import { computed } from 'vue';
import { useStore } from 'vuex';

import { _VIEW } from '@shell/config/query-params';

export const useFileItem = ({ props = {}, emit }) => {
  const store = useStore();

  const { isFile, currentPath, file = {} } = props;

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
      if (!props.resource.actions.download) {
        return;
      }

      store.dispatch('cluster/promptModal', {
        component:      'TextViewerModal',
        modalWidth:     '1000px',
        componentProps: {
          contentFunc: async() => {
            const res = await props.resource.doAction('download', { targetFilePath: currentPath.value }, { responseType: 'blob' });

            const out = await res.data.text();

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
