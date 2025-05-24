import { computed } from 'vue';

export const useFileItem = ({
  props = {},
}) => {
  const {isFile, currentPath} = props;
  const currentFolder = computed(() => {
    if (isFile.value) {
      return currentPath.value.split('/').slice(0, -1).join('/');
    } else {
      return currentPath.value.split('/').slice(0, -2).join('/');
    }
  });

  return {
    currentFolder
  };
};
