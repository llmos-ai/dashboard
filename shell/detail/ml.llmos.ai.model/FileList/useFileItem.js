import { computed } from 'vue';

export const useFileItem = ({ props = {} }) => {
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

  return {
    currentFolder,
    fileType,
    fileName,
  };
};
