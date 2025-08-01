<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DownOutlined, SwapOutlined } from '@ant-design/icons-vue';
import { useFileList } from '@shell/detail/ml.llmos.ai.model/FileList/useFileList';

import FileItem from './FileItem';
import ProgressList from '@shell/components/ProgressList';

const props = defineProps({
  files: {
    type:    Array,
    default: () => ([]),
  },

  resource: {
    type:     Object,
    required: true,
  },

  hasFolder: {
    type:    Boolean,
    default: true,
  },

  showHeader: {
    type:    Boolean,
    default: false,
  },

  mode: {
    type:    String,
    default: 'create',
  },

  dataCollectionName: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['fetchFiles', 'checked']);

const store = useStore();
const { t } = useI18n(store);

// Reactive data
const downloading = ref(false);
const checkedFiles = ref([]);

const {
  fileList,
  showModal,
  currentPath,
  onUpload: originalOnUpload,
} = useFileList({
  props: { resource: props.resource },
  emit,
});

// 包装onUpload函数，为datacollection添加needSyncFiles参数
const onUpload = async(options) => {
  return await originalOnUpload({
    ...options,
    needSyncFiles: true
  });
};

const isView = computed(() => {
  return props.mode === 'view';
});

const downloadCount = computed(() => {
  return fileList.value?.length || 0;
});

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

  const res = await props.resource.doAction('download', {}, { responseType: 'blob' });

  const fileName = `${ props.resource.metadata.name }.zip`;

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  downloading.value = false;
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

const onChecked = ({ file, checked }) => {
  const isChecked = checkedFiles.value.find((f) => f.uid === file.uid);

  if (checked) {
    if (!isChecked) {
      checkedFiles.value.push({
        ...file,
        dataCollectionName: props.dataCollectionName,
      });
    }
  } else {
    checkedFiles.value = checkedFiles.value.filter((f) => f.uid !== file.uid);
  }

  emit('checked', checkedFiles.value);
};

const onShowFileProgressModal = () => {
  showModal.value = true;
};

const close = () => {
  showModal.value = false;

  emit('fetchFiles', currentPath.value);
};
</script>

<template>
  <div
    v-if="!isView"
    class="row"
  >
    <div class="col span-12">
      <div
        v-if="hasFolder"
        class="pull-left"
      >
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
            v-if="hasFolder"
            type="primary"
            @click="onCreateFolder"
          >
            {{ t('fileList.createFolder') }}
          </a-button>
          <a-button
            v-if="hasFolder"
            type="primary"
            :loading="downloading"
            @click="onDownload"
          >
            {{ t('fileList.download') }}
          </a-button>
          <a-dropdown-button
            v-if="hasFolder"
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
          <a-button
            v-else
            type="primary"
          >
            <a-upload
              :customRequest="onUpload"
              :showUploadList="false"
              accept=".markdown, .md, .txt, .json"
            >
              <span class="btn-text p-0">
                {{ t('fileList.addFile') }}
              </span>
            </a-upload>
          </a-button>

          <a-badge
            :count="downloadCount"
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
            <th
              v-if="isView"
              class="border-b border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 w-16"
            />
            <th class="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900">
              文件名称
            </th>
            <th class="border-b border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 w-32">
              文件大小
            </th>
            <th class="border-b border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 w-40">
              上传时间
            </th>
            <th
              v-if="!isView"
              class="border-b border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 w-20"
            >
              操作
            </th>
          </tr>
        </thead>

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

        <tbody
          v-else
          class="bg-white"
        >
          <FileItem
            v-for="file in files"
            :key="file.uid"
            :file="file"
            :resource="resource"
            :mode="mode"
            @fetchFiles="fetchFiles"
            @onChecked="onChecked"
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

.file-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
