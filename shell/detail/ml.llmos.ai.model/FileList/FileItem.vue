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

const emit = defineEmits(['fetchFiles', 'checked']);

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
  return props.file.Path ? props.file.Path.replace(`models/${ props.resource.id }/`, '') : '';
});

const isView = computed(() => {
  return props.mode === 'view';
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

const onChecked = (e) => {
  checked.value = e.target.checked;
  emit('checked', { file: props.file, checked: checked.value });
};
</script>

<template>
  <tr class="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200">
    <td
      v-if="isView"
      class="px-4 py-3 text-center"
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
