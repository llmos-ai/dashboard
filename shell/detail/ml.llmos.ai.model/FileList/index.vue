<script>
import { DownOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useFileList } from '@shell/detail/ml.llmos.ai.model/FileList/useFileList';
import FileItem from './FileItem';

export default {
  name: 'FileList',

  components: {
    DownOutlined,
    FileItem
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

    hasFolder: {
      type:    Boolean,
      default: true,
    },
  },

  emits: ['fetchFiles'],

  data() {
    return {
      downloading:  false,
      uploading:    false,
      currentPath:  '',
      percent:      0,
      uploadStatus: '',
    };
  },

  created() {
    const { percent, uploadStatus, uploadFile } = useFileList({ props: { resource: this.resource } });

    this.uploadFile = uploadFile;
    this.percent = percent;
    this.uploadStatus = uploadStatus;
  },

  methods: {
    async onCreateFolder() {
      this.$store.dispatch('cluster/promptModal', {
        component:      'CreateFolderModal',
        modalWidth:     '600px',
        resources:      [this.resource],
        componentProps: {
          saveCb: () => {
            this.$emit('fetchFiles', this.currentPath);
          },
          currentPath: this.currentPath,
        },
      });
    },

    async onDownload() {
      this.downloading = true;

      const res = await this.resource.doAction('download', {}, { responseType: 'blob' });

      const fileName = `${ this.resource.metadata.name }.zip`;

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

    async fetchFiles(targetFilePath) {
      this.currentPath = targetFilePath;
      this.$emit('fetchFiles', targetFilePath);
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
        this.$emit('fetchFiles');
      } catch (err) {
        message.error(`Upload Fail: ${ err }`);
      } finally {
        this.uploading = false;
        this.uploadStatus = '';
        this.percent = 0;
      }
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
  },
};
</script>

<template>
  <div class="row">
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
            type="primary"
            :loading="downloading"
            @click="onDownload"
          >
            {{ t('fileList.download') }}
          </a-button>
          <a-dropdown-button
            v-if="hasFolder"
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
            v-else
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
          </a-button>
        </a-space>
      </div>
    </div>
  </div>
  <div class="file-list mt-10">
    <div
      v-if="uploadStatus"
      class="upload-progress mb-5"
    >
      <div class="mb-5">
        {{ uploadStatus }}
      </div>
      <a-progress
        :percent="percent"
        :status="percent === 100 ? 'success' : 'active'"
      />
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
