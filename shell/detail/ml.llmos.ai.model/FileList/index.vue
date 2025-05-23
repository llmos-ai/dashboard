<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { useStore } from 'vuex';
import { DownOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { CSRF } from '@shell/config/cookies';

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
});

const emit = defineEmits(['fetchFiles']);

const downloading = ref(false);
const uploading = ref(false);
const currentPath = ref('');
const percent = ref(0);
const uploadStatus = ref('');

const onCreateFolder = async() => {
  store.dispatch('cluster/promptModal', {
    component:      'CreateFolderModal',
    modalWidth:     '600px',
    resources:      [props.resource],
    componentProps: {
      saveCb: () => {
        emit('fetchFiles', currentPath.value);
      },
      currentPath: currentPath.value,
    },
  });
};

const onDownload = async() => {
  downloading.value = true;

  const inStore = store.getters['currentProduct'].inStore;
  const res = await props.resource.doAction('download', {}, { responseType: 'blob' });

  const fileName = `${ props.resource.metadata.name }.zip`;

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

const fetchFiles = async(targetFilePath) => {
  currentPath.value = targetFilePath;
  emit('fetchFiles', targetFilePath);
};

const onUpload = async(options) => {
  const { file } = options;

  try {
    uploading.value = true;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('data', JSON.stringify({
      targetDirectory: currentPath.value,
      relativePath:    '',
    }));

    const csrf = store.$cookies.get(CSRF, { parseJSON: false })

    const res = await fetch(props.resource.actions.upload, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'x-api-csrf': csrf,
      },
      body: formData,
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const eventData = JSON.parse(line.slice(5));
            percent.value = Math.floor((eventData.readSize / eventData.totalSize) * 100);
            uploadStatus.value = `正在上传: ${eventData.destPath}`;
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }

    message.success('Upload Success');
    emit('fetchFiles');
  } catch (err) {
    message.error(`Upload Fail: ${err}`);
  } finally {
    uploading.value = false;
    uploadStatus.value = '';
    percent.value = 0;
  }
};

const onFolderUpload = async(options) => {
  const { file } = options;

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

    await props.resource.doAction('upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

    message.success('Upload Success');
    emit('fetchFiles');
  } catch (err) {
    message.error('Upload Fail');
  } finally {
    uploading.value = false;
  }
};

const onBack = () => {
  const parentPath = currentPath.value.split('/').slice(0, -2).join('/');

  currentPath.value = parentPath || '';
  emit('fetchFiles', parentPath);
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
        <a-button
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
            :loading="uploading"
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
        </a-space>
      </div>
    </div>
  </div>
  <div class="file-list mt-10">
    <div v-if="uploadStatus" class="upload-progress mb-4">
      <div class="mb-2">{{ uploadStatus }}</div>
      <a-progress :percent="percent" :status="percent === 100 ? 'success' : 'active'" />
    </div>
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
      :resource="resource"
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
