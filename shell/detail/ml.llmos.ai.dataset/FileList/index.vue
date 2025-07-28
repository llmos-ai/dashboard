<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DownOutlined, SwapOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

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
const publishing = ref(false);
const selectedVersion = ref('');

const {
  fileList,
  showModal,
  currentPath,
  onUpload,
  updateResource,
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

const isPublished = computed(() => {
  const phase = props.datasetVersion.status?.publishStatus?.phase;

  return phase === 'SnapshotReady';
});

const isPublishing = computed(() => {
  const publish = props.datasetVersion.spec?.publish;

  return publish && !isPublished.value;
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

const onPublish = async() => {
  publishing.value = true;

  try {
    const isPublished = props.datasetVersion.spec?.publish;
    const data = { spec: { publish: !isPublished } };

    await props.datasetVersion.patch(
      data,
      { headers: { 'content-type': 'application/merge-patch+json' } },
      true,
      true
    );
  } catch (error) {
    message.error('发布操作失败');
  } finally {
    publishing.value = false;
  }
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
  const targetVersion = props.datasetVersions.find((v) => v.spec.version === selectedVersion.value);

  if (targetVersion && updateResource) {
    updateResource(targetVersion);
  }
  emit('fetchFiles', '', selectedVersion.value);
};

const close = () => {
  showModal.value = false;

  emit('fetchFiles', currentPath.value);
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
            :type="isPublished ? 'default' : 'primary'"
            :loading="isPublishing"
            @click="onPublish"
          >
            {{ isPublished ? '取消发布' : '发布' }}
          </a-button>
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
                    :customRequest="onUpload"
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
  <div class="mt-10">
    <div
      class="border border-gray-300 rounded-lg overflow-hidden"
      style="min-height: 50vh; max-height: 58vh; overflow-y: auto;"
    >
      <table class="table-auto w-full border-collapse">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th class="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              文件名称
            </th>
            <th class="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-32">
              文件大小
            </th>
            <th class="border-b border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 w-40">
              上传时间
            </th>
            <th class="border-b border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 w-20">
              操作
            </th>
          </tr>
        </thead>

        <div
          v-if="files.length === 0"
          class="empty-image"
        >
          <a-empty
            :imageStyle="{
              'min-height': '50vh',
            }"
            :description="null"
          />
        </div>
        <tbody
          v-else
          class="bg-white"
        >
          <FileItem
            v-for="file in files"
            :key="file.Name"
            :file="file"
            :resource="datasetVersion"
            @fetchFiles="fetchFiles"
          />
        </tbody>
      </table>
    </div>
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
.btn-text {
  color: #fff;
}

.empty-image {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
