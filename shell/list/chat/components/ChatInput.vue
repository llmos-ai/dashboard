<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import {
  ArrowUpOutlined,
  PauseOutlined,
} from '@ant-design/icons-vue';

const props = defineProps({
  loading: {
    type:    Boolean,
    default: false,
  },
});

const model = defineModel();

const emit = defineEmits(['input', 'submit', 'update:abort']);

const fileList = ref([]);

// const customRequest = (options) => {
//   const { file, onSuccess } = options;

//   file.thumbUrl = URL.createObjectURL(file);
//   // 创建一个 FileReader 实例
//   const reader = new FileReader();

//   // 读取文件并转换为 base64
//   reader.readAsDataURL(file);

//   // 读取完成后触发
//   reader.onload = () => {
//     // file.thumbUrl 仍然是 URL 预览
//     file.thumbUrl = URL.createObjectURL(file);
//     console.log('🚀 ~ file.thumbUrl:', file.thumbUrl);

//     // base64 数据
//     const base64Data = reader.result;

//     console.log('🚀 ~ file.base64Data:', base64Data);

//     // 将 base64 数据存入 file 对象
//     file.base64 = base64Data;

//     // 更新 fileList

//     // 模拟上传成功
//     if (onSuccess) {
//       onSuccess('ok');
//     }
//   };

//   // 错误处理
//   reader.onerror = (error) => {
//     console.error('文件读取失败:', error);
//   };
//   console.log('🚀 ~ customRequest ~ file:', file);

//   fileList.value = [...fileList.value, file];
// };

const handleRemove = (file) => {
  const index = fileList.value.indexOf(file);
  const newFileList = fileList.value.slice();

  newFileList.splice(index, 1);
  fileList.value = newFileList;
};

const submit = () => {
  if (!props.loading) {
    emit('submit', model.value, fileList);
  }
};
</script>

<template>
  <div class="area-wrapper flex-col w-full">
    <div class="flex p-1">
      <a-image
        v-for="file in fileList"
        :key="file.uid"
        :src="file.thumbUrl"
        :height="100"
      />
    </div>
    <a-textarea
      v-model:value="model"
      placeholder="询问任何问题"
      :autoSize="{ minRows: 4, maxRows: 7 }"
      :bordered="false"
      @keyup.alt.enter.exact="submit"
    />
    <div class="flex items-center justify-between">
      <div class="left" />
      <div class="right flex items-center mb-5 mr-5">
        <!-- <a-upload
          :multiple="true"
          :default-file-list="fileList"
          list-type="picture"
          :show-upload-list="false"
          :customRequest="customRequest"
          @remove="handleRemove"
        >
          <PictureOutlined class="text-xl cursor-pointer" />
        </a-upload> -->
        <a-divider
          type="vertical"
          class="mt-5"
          style="height: 15px"
        />

        <a-tooltip v-if="loading">
          <template #title>
            停止生成
          </template>
          <a-button
            type="primary"
            shape="circle"
            @click="emit('update:abort')"
          >
            <PauseOutlined
              class="font-semibold"
            />
          </a-button>
        </a-tooltip>

        <a-tooltip v-else>
          <template #title>
            发送
          </template>
          <a-button
            type="primary"
            :disabled="model.length === 0"
            shape="circle"
            @click="submit"
          >
            <template #icon>
              <ArrowUpOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.area-wrapper {
  border-radius: var(--border-radius);
  border: solid var(--border-width) var(--input-border);
  border-color: #d9d9d9;
  border-radius: 6px;

  &:hover {
    border-color: #4096ff !important;
  }
}
</style>
