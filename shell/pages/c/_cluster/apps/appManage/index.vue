<template>
  <div class="min-h-screen p-6">
    <header class="flex mb-[20px]">
      <h1>
        应用管理
      </h1>

      <!-- 右侧按钮组 -->
      <a-space class="flex items-center ml-auto">
        <a-button
          :loading="loading || detailsLoading"
          type="primary"
          @click="refreshProjects"
        >
          <template #icon>
            <ReloadOutlined />
          </template>
          {{ t('action.refresh') }}
        </a-button>
        <a-button
          type="primary"
          class="bg-black hover:bg-gray-800 border-black"
          @click="handleCreate"
        >
          {{ t('generic.create') }}
        </a-button>
      </a-space>
    </header>

    <!-- 顶部工具栏 -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-4  ml-auto">
        <!-- 视图切换按钮 -->
        <div class="flex items-center">
          <a-radio-group
            v-model:value="viewMode"
            button-style="solid"
          >
            <a-radio-button value="list">
              <i
                class="icon icon-list-flat"
              />
            </a-radio-button>
            <a-radio-button value="grid">
              <i
                class="icon icon-apps"
              />
            </a-radio-button>
          </a-radio-group>
        </div>
        <!-- 搜索框 -->
        <div class="relative">
          <a-input
            v-model:value="searchQuery"
            placeholder="Search flows..."
            class="w-80"
          >
            <template #prefix>
              <SearchOutlined class="text-gray-400" />
            </template>
          </a-input>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <a-spin
      :spinning="detailsLoading"
      tip="Loading..."
    >
      <div class="space-y-8">
        <div
          v-for="project in filteredProjectDetails"
          :key="project.projectId"
        >
          <!-- 项目标题 -->
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            {{ project.data.name }}
          </h2>

          <!-- 流程列表视图 -->
          <div
            v-if="viewMode === 'list'"
            class="space-y-3"
          >
            <div
              v-for="flow in project.data.flows"
              :key="flow.id"
              class="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
              @click="handleEdit(project.projectId, flow.id)"
            >
              <div class="p-4">
                <div class="flex items-center justify-between">
                  <!-- 左侧内容 -->
                  <div class="flex items-center space-x-2 flex-1">
                    <!-- 图标 -->
                    <div class="flex items-center justify-center">
                      <LangFlowIcon
                        :type="getFlowIconType(flow.name)"
                        :class="getFlowIconClass(flow.name)"
                        class="w-10 h-10"
                      />
                    </div>

                    <!-- 流程信息 -->
                    <div class="flex-1">
                      <div class="flex items-center">
                        <div class="text-base font-medium text-gray-900">
                          {{ flow.name }}
                        </div>
                        <span class="text-sm text-gray-500 ml-1">
                          Edited {{ formatDate(flow.updated_at) }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 mt-1 line-clamp-1">
                        {{ flow.description || 'No description available' }}
                      </p>
                    </div>
                  </div>

                  <!-- 右侧操作按钮 -->
                  <div class="flex items-center space-x-2">
                    <a-dropdown
                      trigger="click"
                      placement="bottomRight"
                    >
                      <a-button
                        type="text"
                        size="small"
                        class="text-gray-400 hover:text-gray-600"
                        @click.stop
                      >
                        <MoreOutlined />
                      </a-button>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item @click="handleEdit(project.projectId, flow.id)">
                            <EditOutlined class="mr-2" />
                            Edit
                          </a-menu-item>
                          <a-menu-item @click="handleDownload(flow.id, flow.name)">
                            <DownloadOutlined class="mr-2" />
                            Download
                          </a-menu-item>
                          <a-menu-divider />
                          <a-menu-item
                            class="text-red-600"
                            @click="handleDelete(flow.id)"
                          >
                            <DeleteOutlined class="mr-2" />
                            Delete
                          </a-menu-item>
                        </a-menu>
                      </template>
                    </a-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 流程网格视图 -->
          <div
            v-else-if="viewMode === 'grid'"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
          >
            <div
              v-for="flow in project.data.flows"
              :key="flow.id"
              class="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              @click="handleEdit(project.projectId, flow.id)"
            >
              <div class="p-4">
                <!-- 顶部图标和操作按钮 -->
                <div class="flex items-start justify-between mb-1">
                  <div class="flex items-center">
                    <LangFlowIcon
                      :type="getFlowIconType(flow.name)"
                      :class="getFlowIconClass(flow.name)"
                      class="w-10 h-10 mr-1"
                    />
                    <div class="h-10">
                      <div class="text-base font-medium text-gray-900">
                        {{ flow.name }}
                      </div>
                      <span class="text-xs text-gray-500">
                        Edited {{ formatDate(flow.updated_at) }}
                      </span>
                    </div>
                  </div>
                  <a-dropdown
                    trigger="click"
                    placement="bottomRight"
                  >
                    <a-button
                      type="text"
                      size="small"
                      class="text-gray-400 hover:text-gray-600"
                      @click.stop
                    >
                      <MoreOutlined />
                    </a-button>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item @click="handleEdit(project.projectId, flow.id)">
                          <EditOutlined class="mr-2" />
                          Edit
                        </a-menu-item>
                        <a-menu-item @click="handleDownload(flow.id, flow.name)">
                          <DownloadOutlined class="mr-2" />
                          Download
                        </a-menu-item>
                        <a-menu-divider />
                        <a-menu-item
                          class="text-red-600"
                          @click="handleDelete(flow.id)"
                        >
                          <DeleteOutlined class="mr-2" />
                          Delete
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>

                <!-- 流程信息 -->
                <div>
                  <p class="text-sm text-gray-600 mb-2 line-clamp-2">
                    {{ flow.description || 'No description available' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredProjectDetails.length === 0 && !detailsLoading"
        class="text-center py-16"
      >
        <div class="text-gray-400 text-lg mb-2">
          No flows found
        </div>
        <div class="text-gray-500 text-sm">
          Try adjusting your search or create a new flow
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  ReloadOutlined,
  MoreOutlined,
  SearchOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import { useFetch } from '@vueuse/core';
import LangFlowIcon from '@shell/components/LangFlowIcon.vue';

const projectDetails = ref([]);
const detailsLoading = ref(false);
const searchQuery = ref('');
const viewMode = ref('list');

// 计算过滤后的项目列表
const filteredProjectDetails = computed(() => {
  if (!searchQuery.value) {
    return projectDetails.value;
  }

  return projectDetails.value.map((project) => ({
    ...project,
    data: {
      ...project.data,
      flows: project.data.flows.filter((flow) => flow.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (flow.description && flow.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
      )
    }
  })).filter((project) => project.data.flows.length > 0);
});

// 获取流程图标类型
const getFlowIconType = (flowName) => {
  const name = flowName.toLowerCase();

  if (name.includes('chat') || name.includes('memory')) {
    return 'chat';
  } else if (name.includes('agent') || name.includes('financial')) {
    return 'agent';
  } else if (name.includes('prompt') || name.includes('basic')) {
    return 'prompt';
  } else if (name.includes('llmos') || name.includes('model')) {
    return 'model';
  } else if (name.includes('vector') || name.includes('rag')) {
    return 'database';
  }

  return 'workflow';
};

// 获取流程图标颜色样式
const getFlowIconClass = (flowName) => {
  const colors = [
    'white',
    'text-green-500',
    'text-cyan-500',
    'text-purple-500',
    'text-pink-500',
    'text-indigo-500'
  ];

  // 根据流程名称生成一致的颜色
  const hash = flowName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);

    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${ diffDays } days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const loadProjectFlows = async(projectId) => {
  try {
    const res = await fetch(`/proxy/apps/api/v1/projects/${ projectId }`);

    if (!res.ok) throw new Error(`HTTP ${ res.status }`);
    const data = await res.json();

    return data;
  } catch (err) {
    throw new Error(`loading project ${ projectId } failed: ${ err.message }`);
  }
};

const {
  data: loading, execute: refetchProjects
} = useFetch('/proxy/apps/api/v1/projects/', {
  immediate:  true,
  afterFetch: async(data) => {
    if (Array.isArray(data.data)) {
      await loadAllProjects(data.data);
    }

    return data;
  }
}).json();

const loadAllProjects = async(projects) => {
  const projectIds = projects.map((p) => p.id).filter(Boolean);

  if (projectIds.length === 0) return;

  detailsLoading.value = true;

  try {
    const results = await Promise.allSettled(
      projectIds.map((id) => loadProjectFlows(id))
    );

    const successfulDetails = results
      .map((res, index) => {
        if (res.status === 'fulfilled') {
          return {
            projectId: projectIds[index],
            data:      res.value
          };
        }

        return null;
      })
      .filter(Boolean);

    projectDetails.value = successfulDetails;
  } catch (err) {
  } finally {
    detailsLoading.value = false;
  }
};

const refreshProjects = async() => {
  await refetchProjects();
};

const handleEdit = (projectId, flowId) => {
  const currentHost = window.location.hostname;
  const editUrl = `http://${ currentHost }:8080/flow/${ flowId }/folder/${ projectId }`;

  window.open(editUrl, '_blank');
};

const handleCreate = () => {
  const currentHost = window.location.hostname;
  const editUrl = `http://${ currentHost }:8080/flows`;

  window.open(editUrl, '_blank');
};

const handleDownload = async(flowId, flowName) => {
  try {
    // 根据Langflow API文档，使用 /api/v1/flows/{flow_id} 获取流程配置
    const downloadUrl = `/proxy/apps/api/v1/flows/${ flowId }`;

    const res = await fetch(downloadUrl, {
      method:  'GET',
      headers: {
        Accept:         'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`下载失败: HTTP ${ res.status }`);
    }

    // 获取流程配置数据
    const flowData = await res.json();

    // 创建JSON文件内容
    const jsonContent = JSON.stringify(flowData, null, 2);
    const fileName = `${ flowName || 'langflow-config' }.json`;

    // 创建下载链接
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    Modal.error({
      title:   '下载失败',
      content: `下载Langflow配置文件失败: ${ err.message }`
    });
  }
};

const handleDelete = async(flowId) => {
  Modal.confirm({
    title:      '确认删除',
    content:    '确定要删除这个流程吗？此操作不可撤销。',
    okText:     '确定',
    cancelText: '取消',
    okType:     'danger',
    async onOk() {
      try {
        const res = await fetch(`/proxy/apps/api/v1/flows/${ flowId }`, { method: 'DELETE' }) ;

        if (!res.ok) {
          throw new Error(`删除失败: HTTP ${ res.status }`);
        }

        refreshProjects();

        Modal.success({
          title:   '删除成功',
          content: '流程已成功删除'
        });
      } catch (err) {
        Modal.error({
          title:   '删除失败',
          content: `删除失败: ${ err.message }`
        });
      }
    }
  });
};
</script>

<style scoped>
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
