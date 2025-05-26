<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue';
import { useStore } from 'vuex';
import {
  FolderOutlined,
  HeartOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import dayjs from 'dayjs';
import { addUnit } from '@shell/utils/units';
import { useFetch, debouncedRef } from '@vueuse/core';
import MarkedView from '@shell/components/MarkedView';
import { message } from 'ant-design-vue';

import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

const store = useStore();

const emits = defineEmits(['update:item']);
const props = defineProps({
  source: {
    type:     String,
    required: true,
  },
  modelId: {
    type:    String,
    default: '',
  },
  defaultSearch: {
    type:    String,
    default: '',
  }
});

const search = ref(props.defaultSearch);
const apiConfig = computed(() => {
  if (props.source === 'huggingface') {
    return {
      listUrl:   `https://huggingface.co/api/models?limit=100&search=${ search.value }&pipeline_tag=text-generation&sort=trendingScore`,
      detailUrl: (id) => `https://huggingface.co/${ id }/resolve/main/README.md`,
      method:    'GET',
      body:      null,
    };
  } else if (props.source === 'modelscope') {
    return {
      listUrl:   `https://www.modelscope.cn/api/v1/dolphin/models`,
      detailUrl: (id) => `https://modelscope.cn/api/v1/models/${ id }`,
      method:    'PUT',
      body:      JSON.stringify({
        Name:       search.value,
        tags:       [],
        tasks:      [],
        SortBy:     'Default',
        PageSize:   100,
        PageNumber: 1,
      }),
    };
  }

  return {};
});


onMounted(async() => {
  await allHash({
    localModels: await store.dispatch(`cluster/findAll`, { type: LLMOS.LOCAL_MODEL }),
  });
});

const listData = computed(() => {
  return store.getters[`cluster/all`](LLMOS.LOCAL_MODEL) || [];
});

const formatDataSource = computed(() => {
  console.log(listData.value, 'vale')
  return listData.value.map((item) => {
    return {
      id:          item.id,
      createdAt:   item.createdAt,
    };
  })
});

const removeFrontMatter = (markdown) => {
  return markdown?.replace(/^---\n[\s\S]*?\n---\n/, '') || '';
};

// click choose logic
const activeItem = ref({});
const handleItemClick = (item) => {
  emits('update:item', item);
  activeItem.value = item;
  readme.value = '';
};

// readme logic
const readmeUrl = computed(() => {
  if (!activeItem.value.id) return '';

  return `/proxy?url=${ encodeURIComponent(apiConfig.value.detailUrl(activeItem.value.id)) }`;
});

const debouncedReadmeUrl = debouncedRef(readmeUrl, 500);
const { data: readme, isFetching: readmeLoading, execute: readmeFetchExecute } = useFetch(readmeUrl, { immediate: false }, { refetch: true }).get();
const formatReadme = computed(() => {
  if (props.source === 'huggingface') {
    return removeFrontMatter(readme.value);
  } else {
    let readmeJson = '';

    try {
      readmeJson = JSON.parse(readme.value);
    } catch (err) {
      return '';
    }

    return readmeJson?.Data?.ReadMeContent;
  }
});

watch(debouncedReadmeUrl, () => readmeFetchExecute);

watchEffect(() => {
  if (formatDataSource.value && formatDataSource.value.length > 0 && !activeItem.value.id) {
    if (!props.defaultSearch) {
      activeItem.value = formatDataSource.value[0];
      emits('update:item', formatDataSource.value[0]);
    } else {
      activeItem.value = formatDataSource.value.find((item) => item.id === props.defaultSearch);
    }
  }
});

</script>

<template>
  <a-row :gutter="16">
    <a-col
      :sm="10"
      :lg="10"
      :xl="9"
      :xxl="6"
    >
      <div class="flex flex-col h-full">
        <a-input
          v-model:value="search"
          :placeholder="t('modelService.searchPlaceholder', { source: source })"
          allow-clear
          class="mb-2"
        />
        <div class="h-[0] grow-1">
          <simplebar class="h-full">
            <a-list
              item-layout="horizontal"
              :data-source="formatDataSource"
              :split="false"
              :loading="loading"
            >
              <template #renderItem="{ item }">
                <a-list-item
                  :key="item._id"
                  class="border-gray-200 border mb-2 p-2 cursor-pointer rounded-lg pr-2"
                  :class="{ 'bg-gray-200': activeItem.id === item.id }"
                  @click="handleItemClick(item)"
                >
                  <a-list-item-meta>
                    <template #description>
                      <div class="title flex items-center mb-2">
                        <FolderOutlined class="mr-2" />
                        <span class="text-black text-sm">{{ item.id }}</span>
                      </div>
                      <div class="footer flex items-center space-x-1">
                        <span
                          class="text-xs w-[80px] flex items-center justify-start"
                        >
                          <LiveDate
                            :add-suffix="true"
                            :value="item.createdAt"
                          />
                        </span>
                        <div class="ml-auto flex">
                          <span
                            class="text-xs w-[50px] flex items-center justify-start"
                          >
                          </span>
                        </div>
                      </div>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </simplebar>
        </div>
      </div>
    </a-col>

    <a-col
      :sm="14"
      :lg="14"
      :xl="15"
      :xxl="18"
      class="p-[10px]"
    >
      <div class="flex flex-col h-full">
        <div class="h-[0] grow-1">
          <simplebar class="h-full">
            <a-spin
              :spinning="readmeLoading"
              style="height: 100%"
              class="!h-full"
              :delay="500"
            >
              <MarkedView
                v-if="formatReadme"
                :content="formatReadme"
                :clearHtml="false"
              />
            </a-spin>
          </simplebar>
        </div>
      </div>
    </a-col>
  </a-row>
</template>
