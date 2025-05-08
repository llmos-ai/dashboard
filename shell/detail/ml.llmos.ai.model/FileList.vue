<script setup>
import { ref, defineProps, computed, reactive, defineEmits } from 'vue';
import { useStore } from 'vuex';
import { DownOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { formatSi } from '@shell/utils/units';
import { diffFrom } from '@shell/utils/time';
import FileItem from '@shell/detail/ml.llmos.ai.model/FileItem'

const store = useStore();

const props = defineProps({
  files: {
    type:     Array,
    default:  () => ([]),
  },

  resource: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['fetchFiles']);

const downloading = ref(false);
const uploading = ref(false);
const currentPath = ref('');

const onCreateFolder = async () => {
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
}

const onDownload = async () => {
  downloading.value = true;

  const inStore = store.getters['currentProduct'].inStore;
  const res = await props.resource.doAction('download', {}, {
    responseType: 'blob',
  })

  const fileName = `${props.resource.metadata.name}.zip`;
  
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
  
  downloading.value = false;
}

const fetchFiles = async (targetFilePath) => {
  currentPath.value = targetFilePath;
  emit('fetchFiles', targetFilePath);
}

const onUpload = async (options) => {
  const { file, onSuccess, onError } = options;// file 是一个 File 对象，包含了上传的文件信息，如文件名、大小等
  
  try {
    uploading.value = true;
    
    const formData = new FormData();
    formData.append('sourceFilePath', file);
    
    await props.resource.doAction('upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    onSuccess('上传成功');
    emit('fetchFiles');
  } catch (err) {
    onError('上传失败');
  } finally {
    uploading.value = false;
  }
};

const onBack = () => {
  console.log(currentPath.value, 'currentPath')
  const parentPath = currentPath.value.split('/').slice(0, -2).join('/');
  emit('fetchFiles', parentPath);
}
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
      <div>
        <a-button
          type="primary"
          @click="onBack"
        >
          Back
        </a-button>
        {{ currentPath  }}
      </div>
      <div class="pull-right">
        <a-button
          type="primary"
          @click="onCreateFolder"
        >
          Create Folder
        </a-button>
        <a-upload
          :customRequest="onUpload"
          :showUploadList="false"
        >
          <a-button
            type="primary"
            :loading="uploading"
          >
            Add File
          </a-button>
        </a-upload>
        <a-button
          type="primary"
          @click="onDownload"
          :loading="downloading"
        >
          Download
        </a-button>
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
      v-else
      v-for="file in files" 
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
</style>
