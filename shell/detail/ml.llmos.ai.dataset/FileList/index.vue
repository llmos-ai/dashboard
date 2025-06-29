<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DownOutlined, SwapOutlined } from '@ant-design/icons-vue';

import { useFileList } from '@shell/detail/ml.llmos.ai.model/FileList/useFileList';
import ProgressList from '@shell/components/ProgressList';

import FileItem from './FileItem';

const props = defineProps({
  files: {
    type:    Array,
    default: () => ([]),
  },

  resource: {
    type:     Object,
    required: true,
  },

  datasetVersions: {
    type:    Array,
    default: () => ([]),
  },

  datasetVersion: {
    type:    Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['fetchFiles']);

const store = useStore();
const { t } = useI18n(store);

const downloading = ref(false);
const selectedVersion = ref('');

const {
  fileList,
  showModal,
  currentPath,
  onUpload,
  onFolderUpload,
} = useFileList({
  props: { resource: props.datasetVersion },
  emit,
});

const datesetVersionOptions = computed(() => {
  return props.resource.datasetVersions.map((version) => {
    return {
      value: version.spec.version,
      label: ((version.metadata.name || '').split('-') || [])?.[0] || {},
    };
  });
});

selectedVersion.value = (datesetVersionOptions.value[0] || {}).value;

const onDownload = async() => {
  downloading.value = true;

  const res = await props.datasetVersion.doAction('download', {}, { responseType: 'blob' });
  const fileName = `${ props.datasetVersion.metadata.name }.zip`;
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);

  downloading.value = false;
};

const onCreateFolder = async() => {
  store.dispatch('cluster/promptModal', {
    component:      'CreateFolderModal',
    modalWidth:     '600px',
    resources:      [props.datasetVersion],
    componentProps: {
      saveCb: () => {
        emit('fetchFiles', currentPath.value);
      },
      currentPath: currentPath.value,
    },
  });
};

const onShowFileProgressModal = () => {
  showModal.value = true;
};

const fetchFiles = async(targetFilePath) => {
  currentPath.value = targetFilePath;
  emit('fetchFiles', targetFilePath);
};

const onBack = () => {
  const parentPath = currentPath.value.split('/').slice(0, -2).join('/');

  currentPath.value = parentPath || '';
  emit('fetchFiles', parentPath);
};

const switchVersion = () => {
  emit('fetchFiles', '', selectedVersion.value);
};

const close = () => {
  showModal.value = false;
};
</script>

<template>
  <div class="row">
    <div class="col span-12">
      <div class="pull-left">
        <a-select
          v-if="!currentPath"
          v-model:value="selectedVersion"
          style="width: 120px"
          :options="datesetVersionOptions"
          @change="switchVersion"
        />
        <a-button
          v-else
          type="primary"
          @click="onBack"
        >
          {{ t('fileList.back') }}
        </a-button>
        {{ '/' + currentPath }}
      </div>
      <div class="pull-right">
        <a-space>
          <a-button
            type="primary"
            @click="onCreateFolder"
          >
            {{ t('fileList.createFolder') }}
          </a-button>
          <a-button
            type="primary"
            :loading="downloading"
            @click="onDownload"
          >
            {{ t('fileList.download') }}
          </a-button>
          <a-dropdown-button
            type="primary"
          >
            <a-upload
              :customRequest="onUpload"
              :showUploadList="false"
            >
              <span class="btn-text p-0">
                {{ t('fileList.addFile') }}
              </span>
            </a-upload>
            <template #overlay>
              <a-menu>
                <a-menu-item key="uploadFolder">
                  <a-upload
                    :customRequest="onFolderUpload"
                    :showUploadList="false"
                    directory
                  >
                    <span class="">
                      {{ t('fileList.uploadFolder') }}
                    </span>
                  </a-upload>
                </a-menu-item>
              </a-menu>
            </template>
            <template #icon>
              <DownOutlined @click.prevent />
            </template>
          </a-dropdown-button>

          <a-badge
            :count="fileList.length"
            color="blue"
          >
            <a-button
              type="primary"
              @click="onShowFileProgressModal"
            >
              <template #icon>
                <SwapOutlined
                  :rotate="90"
                />
              </template>
            </a-button>
          </a-badge>
        </a-space>
      </div>
    </div>
  </div>
  <div class="file-list mt-10">
    <div
      v-if="files.length === 0"
      class="file-empty"
    >
      <a-empty
        :imageStyle="{
          'min-height': '50vh',
        }"
        :description="null"
      />
    </div>
    <FileItem
      v-for="file in files"
      v-else
      :key="file.Name"
      :file="file"
      :resource="datasetVersion"
      @fetchFiles="fetchFiles"
    />
  </div>

  <a-modal
    v-model:visible="showModal"
    title="文件上传进度"
    :closable="false"
    :maskClosable="false"
    width="600px"
    centered
  >
    <ProgressList
      :file-list="fileList"
    />

    <template #footer>
      <a-button
        type="primary"
        @click="close"
      >
        关闭
      </a-button>
    </template>
  </a-modal>
</template>

<style lang="scss" scoped>
.file-list {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  min-height: 50vh;
}

.btn-text {
  color: #fff;
}
</style>
