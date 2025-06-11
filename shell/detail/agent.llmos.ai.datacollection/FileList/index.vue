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

    showHeader: {
      type:    Boolean,
      default: false,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    checkedFiles: {
      type:    Array,
      default: () => ([]),
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
      checkedFiles: [],
    };
  },

  created() {
    const { percent, uploadStatus, uploadFile } = useFileList({ props: { resource: this.resource } });

    this.uploadFile = uploadFile;
    this.percent = percent;
    this.uploadStatus = uploadStatus;
  },

  computed: {
    isView() {
      return this.mode === 'view';
    },
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

    // onChecked({ file, checked }) {
    //   console.log(checked, 'checked')
    //   const isChecked = this.checkedFiles.find((f) => f.uid === file.uid);
    //   console.log(isChecked, 'isChecked')
    //   if (checked && !isChecked) {
    //     this.checkedFiles.push(file);
    //   } else if (!checked && isChecked) {
    //     this.checkedFiles = this.checkedFiles.filter((f) => f.uid !== file.uid);
    //   }
    // },

    onChecked({ file, checked }) {
      const isChecked = this.checkedFiles.find((f) => f.uid === file.uid);

      if (checked) {
        if (!isChecked) {
          this.checkedFiles.push(file);
        }
      } else {
        this.checkedFiles = this.checkedFiles.filter((f) => f.uid !== file.uid);
      }

      this.$emit('checked', this.checkedFiles);
    },
  },
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
  <div
    v-if="showHeader"
    class="file-item"
  >
    <a-row class="file-info pl-50">
      <a-col
        class="file-name"
        :span="12"
      >
        <span>
          文件名称
        </span>
      </a-col>
      <a-col
        class="file-size"
        :span="4"
      >
        文件大小
      </a-col>
      <a-col
        class="file-date"
        :span="isView ? 8 : 4"
      >
        上传时间
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
    <div v-else>
      <FileItem
        v-for="file in files"
        :key="file.uid"
        :file="file"
        :resource="resource"
        :mode="mode"
        @fetchFiles="fetchFiles"
        @onChecked="onChecked"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.file-list {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  min-height: 50vh;
  max-height: 58vh;
  overflow-y: auto;
}

.btn-text {
  color: #fff;
}

.file-name {
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

.file-size {
  text-align: left;
}
</style>
