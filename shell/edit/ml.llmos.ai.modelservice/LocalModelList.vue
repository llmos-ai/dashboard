<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import {
  FolderOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import MarkedView from '@shell/components/MarkedView';

import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

const store = useStore();
const route = useRoute();

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
const loading = ref(false);
const activeItem = ref({});
const activeVersion = ref(null);

onMounted(async() => {
  loading.value = true;

  const res = await allHash({
    localModels:        await store.dispatch(`cluster/findAll`, { type: LLMOS.LOCAL_MODEL }),
    localModelVersions: await store.dispatch(`cluster/findAll`, { type: LLMOS.LOCAL_MODEL_VERSION }),
  });

  // 检查路由参数中是否有modelname，如果有则尝试选中对应的模型
  const routeModelName = route.query.modelname;
  let selectedModel = null;

  if (routeModelName && typeof routeModelName === 'string') {
    // modelname格式通常是 "namespace/localModel"
    const [namespace, localModelName] = routeModelName.split('/');

    if (namespace && localModelName) {
      // 查找匹配的本地模型
      selectedModel = res.localModels.find((model) => {
        const modelNamespace = model.metadata?.namespace;
        const modelName = model.metadata?.name;

        return modelNamespace === namespace && modelName === localModelName;
      });
    }
  }

  // 如果没有找到匹配的模型或没有路由参数，则选择第一个模型
  if (!selectedModel) {
    selectedModel = res.localModels[0] || {};
  }

  if (selectedModel.id) {
    handleItemClick(selectedModel);
  }

  loading.value = false;
});

// 监听路由参数变化，当modelname改变时自动选中对应模型
watch(
  () => route.query.modelname,
  (newModelName) => {
    if (!newModelName || typeof newModelName !== 'string') {
      return;
    }

    const [namespace, localModelName] = newModelName.split('/');

    if (!namespace || !localModelName) {
      return;
    }

    // 查找匹配的本地模型
    const targetModel = listData.value.find((model) => {
      const modelNamespace = model.metadata?.namespace;
      const modelName = model.metadata?.name;

      return modelNamespace === namespace && modelName === localModelName;
    });

    // 如果找到匹配的模型且不是当前选中的模型，则选中它
    if (targetModel && targetModel.id !== activeItem.value?.id) {
      handleItemClick(targetModel);
    }
  }
);

const listData = computed(() => {
  return store.getters[`cluster/all`](LLMOS.LOCAL_MODEL) || [];
});

const formatDataSource = computed(() => {
  return listData.value.filter((item) => {
    return item.id.includes(search.value);
  });
});

// click choose logic

const onVersionClick = (version) => {
  if (!version || !version.value) {
    message.warning('Invalid version object:', version);

    return;
  }

  activeVersion.value = version.value;

  const selectedVersion = store.getters[`cluster/byId`](LLMOS.LOCAL_MODEL_VERSION, version.value);

  if (selectedVersion && selectedVersion.metadata && selectedVersion.spec) {
    emits('update:item', selectedVersion);
  } else {
    message.warning('Selected version not found in store:', version.value);
  }
};

const formatReadme = computed(() => {
  const readmeJson = '';

  // try {
  //   readmeJson = JSON.parse(readme.value);
  // } catch (err) {
  //   return '';
  // }

  return readmeJson?.Data?.ReadMeContent;
});

const canShowVersions = computed(() => {
  return activeItem.value?.id || '';
});

// 添加展开状态控制
const expandedItems = ref(new Set());

const toggleExpand = (itemId) => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
};

const handleItemClick = (item) => {
  if (activeItem.value?.id !== item.id) {
    expandedItems.value.clear();
  }

  activeItem.value = item;

  toggleExpand(item.id);

  // 选择最新的版本（第一个版本通常是最新的）
  const latestVersionOption = item.localModelVersionOptions?.[0];

  if (latestVersionOption) {
    // 如果有版本选项，使用版本选项
    onVersionClick(latestVersionOption);
    activeVersion.value = latestVersionOption.value;
  } else {
    // 如果没有版本选项，尝试使用默认版本
    const defaultVersion = item.defaultLocalModelVersion;

    if (defaultVersion && defaultVersion.id) {
      const versionOption = {
        label: defaultVersion.metadata?.name || 'default',
        value: defaultVersion.id,
        age:   defaultVersion.creationTimestamp
      };

      onVersionClick(versionOption);
      activeVersion.value = versionOption.value;
    }
  }
};
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
                <div class="model-item-container">
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
                          <span class="text-xs w-[80px] flex items-center justify-start">
                            <LiveDate
                              :add-suffix="true"
                              :value="item.creationTimestamp"
                            />
                          </span>
                          <div class="ml-auto flex items-center">
                            <a-button
                              v-if="canShowVersions === item.id"
                              type="link"
                              size="small"
                              class="p-0"
                              @click.stop="toggleExpand(item.id)"
                            >
                              <MenuUnfoldOutlined
                                :class="{ 'transform rotate-90': expandedItems.has(item.id) }"
                              />
                            </a-button>
                          </div>
                        </div>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>

                  <!-- 版本子列表 -->
                  <div
                    v-if="expandedItems.has(item.id)"
                    class="ml-4"
                  >
                    <a-list
                      :data-source="item.localModelVersionOptions"
                      :split="false"
                      size="small"
                    >
                      <template #renderItem="{ item: version }">
                        <!-- 在版本列表项中添加选中状态 -->
                        <a-list-item
                          class="border-gray-200 border mb-2 p-1 cursor-pointer rounded-lg"
                          :class="{ 'bg-gray-100': activeVersion === version.value }"
                          @click="onVersionClick(version)"
                        >
                          <div class="text-sm">
                            {{ version.label }}
                          </div>
                          <div class="text-xs text-gray-500">
                            <LiveDate
                              :add-suffix="true"
                              :value="version.age"
                            />
                          </div>
                        </a-list-item>
                      </template>
                    </a-list>
                  </div>
                </div>
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
            <MarkedView
              v-if="formatReadme"
              :content="formatReadme"
              :clearHtml="false"
            />
          </simplebar>
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<style scoped>
.model-item-container {
  margin-bottom: 8px;
}

.transform {
  transition: transform 0.2s;
}

.rotate-90 {
  transform: rotate(90deg);
}
</style>
