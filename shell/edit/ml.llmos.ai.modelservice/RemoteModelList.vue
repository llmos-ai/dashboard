<script setup>
import { ref } from 'vue';
import useFetch from '@shell/composables/useFetch';
import { FolderOutlined, HeartOutlined, DownloadOutlined } from '@ant-design/icons-vue';

defineProps({
  search: {
    type:     String,
    required: true,
  },
});

const { data, loading } = useFetch('/proxy', { url: 'https://huggingface.co/api/models?limit=100' }, {}, []);
const { data: readMeData, loading: readMeLoading } = useFetch(() => '/proxy', { url: 'https://huggingface.co/deepseek-ai/DeepSeek-V3-0324/resolve/main/README.md' }, {}, {});

const active = ref('');

const handleItemClick = (_id) => {
  active.value = _id;
};
</script>

<template>
  <div class="wrapper h-80% flex">
    <div class="grow-1">
      <div class="flex flex-col">
        <a-input
          :value="search"
          placeholder="从Hugging Face搜索模型"
          allow-clear
          class="mb-10"
        />
        {{ loading }}
        <a-list
          item-layout="horizontal"
          :data-source="data"
          :split="false"
          :loading="loading"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="border-gray-200 border mb-10 !p-[8px] cursor-pointer rounded-lg"
              :class="{ 'bg-gray-200': active === item._id }"
              @click="handleItemClick(item._id)"
            >
              <a-list-item-meta>
                <template #description>
                  <div class="title flex items-center mb-20">
                    <FolderOutlined class="mr-[4px]" /> <span class="text-black text-sm">{{ item.id }}</span>
                  </div>

                  <div class="footer flex items-center">
                    <a-space size="middle">
                      <span class="text-xs">4 天前</span>
                      <span class="text-xs flex items-center"><HeartOutlined class="mr-[5px]" />{{ item.likes }}</span>
                      <span class="text-xs flex items-center"><DownloadOutlined class="mr-[5px]" />{{ item.downloads }}</span>
                    </a-space>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
    <div class="grow-1">
      1222
    </div>
    <div class="grow-1">
      3
    </div>
  </div>
</template>
