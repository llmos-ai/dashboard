<script setup>
import {
  ref, defineProps, computed, reactive, defineEmits
} from 'vue';
import { useStore } from 'vuex';
import { DownOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { formatSi } from '@shell/utils/units';
import { diffFrom } from '@shell/utils/time';
import FileItem from './FileItem';

const store = useStore();

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

const downloading = ref(false);
const uploading = ref(false);
const currentPath = ref('');
const selectedVersion = ref('');

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

  const inStore = store.getters['currentProduct'].inStore;
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

const fetchFiles = async(targetFilePath) => {
  currentPath.value = targetFilePath;
  emit('fetchFiles', targetFilePath);
};

const onUpload = async(options) => {
  const { file, onSuccess, onError } = options;// file 是一个 File 对象，包含了上传的文件信息，如文件名、大小等

  try {
    uploading.value = true;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('data', JSON.stringify({
      targetDirectory: currentPath.value,
      relativePath:    '',
    }));

    await props.datasetVersion.doAction('upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

    onSuccess('上传成功');
    emit('fetchFiles');
  } catch (err) {
    onError('上传失败');
  } finally {
    uploading.value = false;
  }
};

const onFolderUpload = async(options) => {
  const { file, onSuccess, onError } = options;

  try {
    uploading.value = true;

    const relativePath = file.webkitRelativePath || '';
    const pathArray = relativePath.split('/');

    pathArray.pop();

    const formData = new FormData();

    formData.append('file', file);
    formData.append('data', JSON.stringify({
      targetDirectory: currentPath.value,
      relativePaths:   pathArray,
    }));

    await props.datasetVersion.doAction('upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

    onSuccess('上传成功');
    emit('fetchFiles');
  } catch (err) {
    onError('上传失败');
  } finally {
    uploading.value = false;
  }
};

const onBack = () => {
  const parentPath = currentPath.value.split('/').slice(0, -2).join('/');

  currentPath.value = parentPath || '';
  emit('fetchFiles', parentPath);
};

const switchVersion = () => {
  emit('fetchFiles', '', selectedVersion.value);
};
</script>

<script>
export default {
  setup() {

  }
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
          Back
        </a-button>
        {{ '/' + currentPath }}
      </div>
      <div class="pull-right">
        <a-button
          type="primary"
          @click="onCreateFolder"
        >
          Create Folder
        </a-button>
        <a-button
          type="primary"
          :loading="downloading"
          @click="onDownload"
        >
          Download
        </a-button>
        <a-dropdown-button
          type="primary"
          :loading="uploading"
        >
          <a-upload
            :customRequest="onUpload"
            :showUploadList="false"
          >
            <span class="btn-text p-0">
              Add File
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
                    Upload Folder
                  </span>
                </a-upload>
              </a-menu-item>
            </a-menu>
          </template>
          <template #icon>
            <DownOutlined @click.prevent />
          </template>
        </a-dropdown-button>
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
