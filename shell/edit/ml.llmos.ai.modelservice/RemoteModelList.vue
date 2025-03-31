<script setup>
import { ref, computed, watch, watchEffect } from 'vue';
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
});

const search = ref('');
const apiConfig = computed(() => {
  if (props.source === 'huggingface') {
    return {
      listUrl:   `https://huggingface.co/api/models?limit=100&search=${ search.value }`,
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

// list logic
const debouncedQuery = debouncedRef(apiConfig.value.listUrl, 500);
const {
  data: listData,
  isFetching: loading,
  execute,
} = useFetch(
  () => `/proxy?url=${ encodeURIComponent(apiConfig.value.listUrl) }`,
  {
    async beforeFetch({ url, options, cancel }) {
      options.method = apiConfig.value.method;
      options.body = apiConfig.value.body;

      return { options };
    },
  }
).json();

// [() => apiConfig.value.listUrl,
watch([search], () => {
  execute();
});
const formatDataSource = computed(() => {
  if (props.source === 'huggingface') {
    return (
      listData.value?.map((item) => {
        return {
          id:          item.id,
          star:        item.likes,
          tags:        item.tags,
          downloads:   item.downloads,
          pipelineTag: item.pipeline_tag,
          createdAt:   item.createdAt,
        };
      }) || []
    );
  } else {
    return (
      listData?.value?.Data?.Model?.Models?.map((item) => {
        const time = dayjs
          .unix(item.CreatedTime)
          .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

        return {
          id:          `${ item.Path }/${ item.Name }`,
          star:        item.Stars,
          tags:        item.Libraries,
          downloads:   item.Downloads,
          pipelineTag: item.Tasks?.[0]?.name,
          createdAt:   time,
        };
      }) || []
    );
  }
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
    activeItem.value = formatDataSource.value[0];
    emits('update:item', formatDataSource.value[0]);
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
      <a-input
        v-model:value="search"
        :placeholder="t('modelService.searchPlaceholder', { source: source })"
        allow-clear
        class="mb-2"
      />
      <div class="flex flex-col h-full">
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
                        <span
                          class="text-xs w-[50px] flex items-center justify-start"
                        >
                          <HeartOutlined class="mr-1" />{{ addUnit(item.star) }}
                        </span>
                        <span
                          class="text-xs w-[50px] flex items-center justify-start"
                        >
                          <DownloadOutlined class="mr-1" />{{
                            addUnit(item.downloads)
                          }}
                        </span>
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
