<script>
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

export default {
  name: 'FileItem',

  components: {
    FileTextTwoTone,
    FolderTwoTone,
  },

  props: {
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
  },

  emits: ['fetchFiles', 'onChecked'],

  setup(props, { emit }) {
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
      return props.file.path ? props.file.path.replace(`datacollections/${ props.resource.id }/sourceFiles/`, '') : '';
    });

    const isView = computed(() => {
      return props.mode === 'view';
    });

    const stateBackground = computed(() => {
      const readyCondition = findBy(props.file.conditions, 'type', 'ready') || {};

      if (readyCondition.status === 'True') {
        return 'green';
      } else {
        return 'orange';
      }
    });

    const stateDisplay = computed(() => {
      const readyCondition = findBy(props.file.conditions, 'type', 'ready') || {};

      if (readyCondition.status === 'True') {
        return 'Ready';
      } else {
        return 'Not Ready';
      }
    });

    const { currentFolder } = useFileItem({
      props: {
        isFile,
        currentPath,
      }
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

    const onRowClick = () => {
      if (isFile.value) {
        props.resource.doAction('download', { targetFilePath: currentPath.value });
      } else {
        emit('fetchFiles', currentPath.value);
      }
    };

    const onChecked = (e) => {
      checked.value = e.target.checked;
      emit('onChecked', { file: props.file, checked: checked.value });
    };

    return {
      t,
      isFile,
      fileSize,
      lastModified,
      currentPath,
      removeFile,
      onRowClick,
      isView,
      checked,
      onChecked,
      stateBackground,
      stateDisplay,
    };
  }
};
</script>

<template>
  <div class="file-item">
    <a-checkbox
      v-if="isView"
      v-model:checked="checked"
      :disabled="stateDisplay === 'Not Ready'"
      @change="onChecked"
    />

    <a-tag
      :color="stateBackground"
      class="ml-10"
    >
      {{ stateDisplay }}
    </a-tag>

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
          v-if="isFile"
        >
          {{ file.Name || file.name }}
        </span>
        <span
          v-else
          class="hand"
          @click="onRowClick"
        >
          {{ file.Name || file.name }}
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
