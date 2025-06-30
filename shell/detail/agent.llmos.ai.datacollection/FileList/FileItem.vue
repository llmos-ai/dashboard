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
import { findBy } from '@shell/utils/array';

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

const stateDisplay = computed(() => {
  const readyCondition = findBy(props.file.conditions, 'type', 'ready') || {};
  const insertObjectCondition = findBy(props.file.conditions, 'type', 'insertObject') || {};
  const deleteObjectCondition = findBy(props.file.conditions, 'type', 'deleteObject') || {};

  if (readyCondition.status === 'True') {
    return 'Ready';
  } else if (insertObjectCondition.status === 'True') {
    return 'Inserting';
  } else if (deleteObjectCondition.status === 'True') {
    return 'Deleting';
  } else {
    return 'Not Ready';
  }
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
  emit('onChecked', { file: props.file, checked: checked.value });
};
</script>

<template>
  <div class="file-item">
    <a-checkbox
      v-if="isView"
      v-model:checked="checked"
      :disabled="stateDisplay !== 'Ready'"
      @change="onChecked"
    />

    <div class="file-icon ml-5">
      <FileTextTwoTone v-if="isFile" />
      <FolderTwoTone v-else />
    </div>

    <a-row class="file-info">
      <a-col
        class="file-name"
        :span="12"
      >
        <span
          class="hand"
          @click="onRowClick"
        >
          {{ file.name }}
        </span>
      </a-col>
      <a-col
        class="file-size"
        :span="4"
      >
        {{ fileSize }}
      </a-col>
      <a-col
        class="file-date"
        :span="isView ? 8 : 4"
      >
        {{ lastModified }}
      </a-col>
      <a-col
        v-if="!isView"
        :span="4"
        class="file-action"
      >
        <span
          class="hand text-error"
          @click="removeFile(file)"
        >
          {{ t('fileItem.remove') }}
        </span>
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);

  &:hover {
    background-color: var(--hover-bg);
  }
}

.file-icon {
  margin-right: 8px;

  .anticon {
    font-size: 20px;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: var(--link);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;

  .file-size {
    margin-right: 16px;
  }
}

.file-date {
  text-align: end;
}

.file-action {
  text-align: end;
}
</style>
