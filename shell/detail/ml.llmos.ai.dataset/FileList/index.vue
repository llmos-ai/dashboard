<script>
import { DownOutlined, SwapOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { useFileList } from '@shell/detail/ml.llmos.ai.model/FileList/useFileList';
import ProgressList from '@shell/components/ProgressList';

import FileItem from './FileItem';

export default {
  components: {
    DownOutlined,
    FileItem,
    SwapOutlined,
    ProgressList,
  },

  props: {
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
  },

  emits: ['fetchFiles'],

  data() {
    return {
      downloading:     false,
      uploading:       false,
      currentPath:     '',
      selectedVersion: '',
      percent:         0,
      uploadStatus:    '',
      showModal:       false,
      uploadFileList:  [],
    };
  },

  computed: {
    datesetVersionOptions() {
      return this.resource.datasetVersions.map((version) => {
        return {
          value: version.spec.version,
          label: ((version.metadata.name || '').split('-') || [])?.[0] || {},
        };
      });
    },
  },

  created() {
    this.selectedVersion = (this.datesetVersionOptions[0] || {}).value;
    const {
      percent, uploadStatus, uploadFile, fileList
    } = useFileList({ props: { resource: this.datasetVersion } });

    this.uploadFile = uploadFile;
    this.percent = percent;
    this.uploadStatus = uploadStatus;
    this.uploadFileList = fileList;
  },

  methods: {
    async onDownload() {
      this.downloading = true;

      const res = await this.datasetVersion.doAction('download', {}, { responseType: 'blob' });
      const fileName = `${ this.datasetVersion.metadata.name }.zip`;
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      this.downloading = false;
    },

    async onCreateFolder() {
      this.$store.dispatch('cluster/promptModal', {
        component:      'CreateFolderModal',
        modalWidth:     '600px',
        resources:      [this.datasetVersion],
        componentProps: {
          saveCb: () => {
            this.$emit('fetchFiles', this.currentPath);
          },
          currentPath: this.currentPath,
        },
      });
    },

    onShowFileProgressModal() {
      this.showModal = true;
    },

    async fetchFiles(targetFilePath) {
      this.currentPath = targetFilePath;
      this.$emit('fetchFiles', targetFilePath);
    },

    async onUpload(options) {
      const { file } = options;

      try {
        this.uploading = true;

        const formData = new FormData();

        formData.append('file', file);
        formData.append('data', JSON.stringify({
          targetDirectory: this.currentPath,
          relativePath:    '',
        }));

        await this.uploadFile(formData);

        message.success('Upload Success');
        this.$emit('fetchFiles');
      } catch (err) {
        message.error(`Upload Fail: ${ err }`);
      } finally {
        this.uploading = false;
        this.uploadStatus = '';
        this.percent = 0;
      }
    },

    async onFolderUpload(options) {
      const { file } = options;

      try {
        this.uploading = true;

        const relativePath = file.webkitRelativePath || '';
        const pathArray = relativePath.split('/');

        pathArray.pop();

        const formData = new FormData();

        formData.append('file', file);
        formData.append('data', JSON.stringify({
          targetDirectory: this.currentPath,
          relativePaths:   pathArray,
        }));

        await this.uploadFile(formData);

        message.success('Upload Success');
        this.$emit('fetchFiles');
      } catch (err) {
        message.error(`Upload Fail: ${ err }`);
      } finally {
        this.uploading = false;
        this.uploadStatus = '';
        this.percent = 0;
      }
    },

    onBack() {
      const parentPath = this.currentPath.split('/').slice(0, -2).join('/');

      this.currentPath = parentPath || '';
      this.$emit('fetchFiles', parentPath);
    },

    switchVersion() {
      this.$emit('fetchFiles', '', this.selectedVersion);
    },

    close() {
      this.showModal = false;
    },
  },
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
      :file-list="uploadFileList"
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
