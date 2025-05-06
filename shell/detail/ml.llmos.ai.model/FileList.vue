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

const onCreateFolder = async () => {
  store.dispatch('cluster/promptModal', {
    component:      'CreateFolderModal',
    modalWidth:     '600px',
    resources:      [props.resource],
    componentProps: {
      saveCb: () => {
        emit('fetchFiles');
      }
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
      <div class="pull-right">
        <a-button
          type="primary"
          @click="onCreateFolder"
        >
          Create Folder
        </a-button>
        <a-button
          type="primary"
          @click="onUpload"
        >
          Add File
        </a-button>
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
    <FileItem 
      v-for="file in files" 
      :key="file.Name"
      :file="file"
    />
  </div>
</template>

<style lang="scss" scoped>
.file-list {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
}
</style>
