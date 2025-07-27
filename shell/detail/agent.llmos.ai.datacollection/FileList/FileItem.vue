<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useFileItem } from '@shell/detail/ml.llmos.ai.model/FileList/useFileItem';
import { FileTextTwoTone, FolderTwoTone } from '@ant-design/icons-vue';

import dayjs from 'dayjs';
import { Modal, message } from 'ant-design-vue';
import { formatSi } from '@shell/utils/units';
import { diffFrom } from '@shell/utils/time';
// import { findBy } from '@shell/utils/array';

const props = defineProps({
  file: {
    type:    Object,
    default: () => ({}),
  },

  resource: {
    type:     Object,
    required: true,
  },

  mode: {
    type:    String,
    default: 'create',
  },
});

const emit = defineEmits(['fetchFiles', 'onChecked']);

const store = useStore();
const { t } = useI18n(store);

const checked = ref(false);

const isFile = computed(() => {
  return props.file.Size !== 0;
});

const fileSize = computed(() => {
  const size = props.file.Size || props.file.size || 0;

  return isFile.value ? formatSi(size, {
    increment: 1024,
    addSuffix: true,
    suffix:    'B',
  }) : '';
});

const lastModified = computed(() => {
  const time = props.file.LastModified || props.file.lastModified;
  const now = dayjs();
  const out = diffFrom(dayjs(time), now, (key, args) => t(key, args));

  return isFile.value ? `${ out.string } ago` : '';
});

const currentPath = computed(() => {
  return props.file.path ? props.file.path.replace(`datacollections/${ props.resource.id }/`, '') : '';
});

const isView = computed(() => {
  return props.mode === 'view';
});

// const stateBackground = computed(() => {
//   const readyCondition = findBy(props.file.conditions, 'type', 'ready') || {};

//   if (readyCondition.status === 'True') {
//     return 'green';
//   } else {
//     return 'orange';
//   }
// });

// const stateDisplay = computed(() => {
//   const readyCondition = findBy(props.file.conditions, 'type', 'ready') || {};
//   const insertObjectCondition = findBy(props.file.conditions, 'type', 'insertObject') || {};
//   const deleteObjectCondition = findBy(props.file.conditions, 'type', 'deleteObject') || {};

//   if (readyCondition.status === 'True') {
//     return 'Ready';
//   } else if (insertObjectCondition.status === 'True') {
//     return 'Inserting';
//   } else if (deleteObjectCondition.status === 'True') {
//     return 'Deleting';
//   } else {
//     return 'Not Ready';
//   }
// });

const {
  currentFolder,
  onRowClick,
} = useFileItem({
  props: {
    ...props,
    isFile,
    currentPath,
  },
  emit,
});

const removeFile = async(file) => {
  Modal.confirm({
    title: t('fileItem.deleteConfirm'),
    async onOk() {
      await props.resource.doAction('remove', { targetFilePath: currentPath.value });

      message.success(t('fileItem.deleteSuccess'));

      emit('fetchFiles', currentFolder.value);
    },
  });
};

const onChecked = (e) => {
  checked.value = e.target.checked;
  emit('onChecked', { file: props.file, checked: checked.value });
};
</script>

<template>
  <tr class="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200">
    <td
      v-if="isView"
      class="px-4 py-3 text-center w-16"
    >
      <a-checkbox
        v-model:checked="checked"
        @change="onChecked"
      />
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center space-x-3">
        <div class="file-icon">
          <FileTextTwoTone
            v-if="isFile"
            class="text-lg"
          />
          <FolderTwoTone
            v-else
            class="text-lg"
          />
        </div>
        <span
          class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium truncate"
          @click="onRowClick"
        >
          {{ file.name }}
        </span>
      </div>
    </td>
    <td class="px-4 py-3 text-sm text-gray-600">
      {{ fileSize }}
    </td>
    <td class="px-4 py-3 text-sm text-gray-600 text-right">
      {{ lastModified }}
    </td>
    <td
      v-if="!isView"
      class="px-4 py-3 text-center"
    >
      <span
        class="text-red-600 hover:text-red-800 cursor-pointer text-sm font-medium"
        @click="removeFile(file)"
      >
        {{ t('fileItem.remove') }}
      </span>
    </td>
  </tr>
</template>

<style lang="scss" scoped>
/* 保留必要的图标样式 */
.file-icon {
  .anticon {
    font-size: 20px;
  }
}
</style>
