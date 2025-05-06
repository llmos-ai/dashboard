<script setup>
import { ref, defineProps, computed, reactive } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { DownOutlined, FileTextTwoTone, FolderTwoTone } from '@ant-design/icons-vue';
import dayjs from 'dayjs';

import { formatSi } from '@shell/utils/units';
import { diffFrom } from '@shell/utils/time';

const store = useStore();
const { t } = useI18n(store);

const props = defineProps({
  file: {
    type:     Object,
    default:  () => ({}),
  },
});

const isFile = computed(() => {
  return props.file.Size !== 0
})

const fileSize = computed(() => {
  return isFile.value ? formatSi(props.file.Size, {
    increment: 1024,
    addSuffix: true,
    suffix: 'B',
  }) : '';
})

const lastModified = computed(() => {
  const now = dayjs();
  const out = diffFrom(dayjs(props.file.LastModified), now, (key, args) => t(key, args))

  return isFile.value ? `${out.string} ago` : '';
})

</script>

<script>
export default {
  setup() {

  }
};
</script>

<template>
  <div 
    class="file-item"
  >
    <div class="file-icon">
      <FileTextTwoTone v-if="isFile"/>
      <FolderTwoTone v-else/>
    </div>

    <a-row 
      class="file-info"
    >
      <a-col class="file-name hand" :span="16">
        {{ file.Name }}
      </a-col>
      <a-col class="file-size" :span="4">
        {{ fileSize }}
      </a-col>
      <a-col class="file-date" :span="4">
        {{ lastModified }}
      </a-col>
    </a-row>
  </div>
</template>

<style lang="scss" scoped>
.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--hover-bg);
  }
}

.file-icon {
  margin-right: 8px;
  
  .anticon {
    font-size: 20px;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: var(--link);
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
</style>
