<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useFileItem } from '@shell/detail/ml.llmos.ai.model/FileList/useFileItem';
import { FileTextTwoTone, FolderTwoTone } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { Modal, message } from 'ant-design-vue';
import { formatSi } from '@shell/utils/units';
import { diffFrom } from '@shell/utils/time';

const props = defineProps({
  file: {
    type:    Object,
    default: () => ({}),
  },

  resource: {
    type:     Object,
    required: true,
  },
});

const emit = defineEmits(['fetchFiles']);

const store = useStore();
const { t } = useI18n(store);

const isFile = computed(() => {
  return props.file.Size !== 0;
});

const fileSize = computed(() => {
  return isFile.value ? formatSi(props.file.Size, {
    increment: 1024,
    addSuffix: true,
    suffix:    'B',
  }) : '';
});

const lastModified = computed(() => {
  const now = dayjs();
  const out = diffFrom(dayjs(props.file.LastModified), now, (key, args) => t(key, args));

  return isFile.value ? `${ out.string } ago` : '';
});

const currentPath = computed(() => {
  const prefix = `datasets/${ props.resource.namespace }/${ props.resource.spec.dataset }/${ props.resource.spec.version }/`;

  return props.file.Path ? props.file.Path.replace(prefix, '') : '';
});

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
</script>

<template>
  <tr class="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200">
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
          class="text-(--link) cursor-pointer font-medium truncate"
          @click="onRowClick"
        >
          {{ file.Name }}
        </span>
      </div>
    </td>
    <td class="px-4 py-3 text-sm text-gray-600">
      {{ fileSize }}
    </td>
    <td class="px-4 py-3 text-sm text-gray-600 text-right">
      {{ lastModified }}
    </td>
    <td class="px-4 py-3 text-center">
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
