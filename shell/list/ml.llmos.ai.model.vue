<script>
import Loading from '@shell/components/Loading';
import ModelGrid from '@shell/components/llmos/ModelGrid.vue';

import ResourceFetch from '@shell/mixins/resource-fetch';

import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

export default {
  name: 'ModelList',

  components: {
    Loading,
    ModelGrid,
  },

  mixins: [
    ResourceFetch,
  ],

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      currentPageNumber: 1,
      pageSize:          9,
      searchQuery:       '',
      searchContext:     '',
      selectedTag:       '',
      selectedType:      '',
      selectedProvider:  '',
    };
  },

  computed: {
    filteredRows() {
      const rows = this.filterTagRows || [];

      let filteredByNamespace = [];
      const isAll = this.$store.getters['isAllNamespaces'];

      if (
        !this.isNamespaced ||
        this.ignoreFilter ||
        this.externalPaginationEnabled ||
        (isAll && !this.currentProduct?.hideSystemResources) ||
        (this.inStore ? this.$store.getters[`${ this.inStore }/haveNamespace`](this.schema.id)?.length : false)
      ) {
        filteredByNamespace = rows;
      } else {
        const includedNamespaces = this.$store.getters['namespaces']();
        const haveAllNamespace = this.$store.getters['haveAllNamespace'];

        filteredByNamespace = rows.filter((row) => {
          if (this.currentProduct?.hideSystemResources && this.isNamespaced) {
            return !!includedNamespaces[row.metadata.namespace] && !row.isSystemResource;
          } else if (!this.isNamespaced) {
            return true;
          } else if (haveAllNamespace) {
            return true;
          } else {
            return !!includedNamespaces[row.metadata.namespace];
          }
        });
      }

      if (this.searchQuery) {
        return filteredByNamespace.filter((row) => {
          return row.metadata.name.toLowerCase().includes(this.searchQuery.toLowerCase());
        });
      }

      return filteredByNamespace;
    },

    filterTagRows() {
      const rows = this.rows || [];

      if (this.selectedTag) {
        return rows.filter((row) => {
          return (row.spec.modelCard.metadata.tags || []).includes(this.selectedTag);
        });
      }

      return rows;
    },

    contextOptions() {
      return [{
        label: '全部',
        value: '',
      }, {
        label: '128K',
        value: '128K',
      }, {
        label: '256K',
        value: '256K',
      }];
    },

    providerOptions() {
      return [{
        label: '全部',
        value: '',
      }, {
        label: '通义',
        value: '通义',
      }, {
        label: 'DeepSeek',
        value: 'DeepSeek',
      }, {
        label: '其他',
        value: '其他',
      }];
    },

    typeOptions() {
      return [{
        label: '全部',
        value: '',
      }, {
        label: '文本生成',
        value: '文本生成',
      }, {
        label: '全模态',
        value: '全模态',
      }, {
        label: '推理模型',
        value: '推理模型',
      }];
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },
  },

  async fetch() {
    await allHash({
      models:             this.$fetchType(this.resource),
      localModels:        this.$store.dispatch(`${ this.inStore }/findAll`, { type: LLMOS.LOCAL_MODEL }),
      localModelVersions: this.$store.dispatch(`${ this.inStore }/findAll`, { type: LLMOS.LOCAL_MODEL_VERSION }),
    });
  },

  methods: {
    onDeleteModel(row) {
      row.promptRemove();
    },

    onShowModelDetail(row) {
      this.$router.push(row.detailLocation);
    },

    onGenerateUploadCommand(row) {
      row.generateUploadScript();
    },

    onCreateLocalModel(row) {
      row.cache();
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div class="model-list">
    <div>
      <a-flex
        class="mb-10"
        justify="flex-end"
      >
        <span />
        <a-input
          v-model:value="searchQuery"
          :aria-label="t('sortableTable.searchLabel')"
          :placeholder="t('sortableTable.search')"
          :style="{ width: '200px' }"
        />
      </a-flex>
    </div>

    <ModelGrid
      v-model:current-page="currentPageNumber"
      :items="filteredRows"
      :page-size="pageSize"
      :total="filteredRows.length"
      test-id-prefix="cluster-tools-app"
      description-field="spec.modelCard.description"
      :show-actions="true"
    >
      <template #actions="{ row }">
        <div class="action-item">
          <a-button
            type="link"
            class="action-btn"
            @click="onShowModelDetail(row)"
          >
            查看模型
          </a-button>
        </div>
        <div class="action-item">
          <a-button
            type="link"
            class="action-btn"
            @click="onGenerateUploadCommand(row)"
          >
            生成上传指令
          </a-button>
        </div>
        <div class="action-item">
          <a-button
            type="link"
            class="action-btn"
            @click="onCreateLocalModel(row)"
          >
            创建本地模型
          </a-button>
        </div>
      </template>
    </ModelGrid>
  </div>
</template>

<style lang="scss" scoped>
.model-list {
  min-height: 80vh;
}

.ant-radio-group {
  border: none;
}

.filter-label {
  font-weight: 500;
  font-size: 14px;
}

.tag-label {
  min-width: 60px;
  font-size: 14px;
  color: var(--input-label);
}

.fixed-header-actions {
  padding: 0 0 5px 0;
  width: 100%;
  z-index: z-index('fixedTableHeader');
  background: transparent;
  display: grid;
  grid-template-columns: [bulk] auto [middle] min-content [search] minmax(
      min-content,
      200px
    );
  grid-column-gap: 10px;

  .search {
    grid-area: search;
    text-align: right;
    justify-content: flex-end;
  }
}

.custom-radio-group {
  :deep(.ant-radio-button-wrapper) {
    height: 32px;
    padding: 4px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-right: 8px;
    background: transparent;

    &::before {
      display: none;  // 移除按钮之间的分隔线
    }

    &:first-child {
      border-radius: 6px;
    }

    &:last-child {
      border-radius: 6px;
    }

    &:hover {
      color: var(--primary);
      border-color: var(--primary);
    }

    &.ant-radio-button-wrapper-checked {
      color: var(--primary);
      border-color: var(--primary);
      box-shadow: none;

      &::before {
        display: none;
      }
    }
  }
}

.tag-label {
  min-width: 60px;
  font-size: 14px;
  color: var(--input-label);
  line-height: 32px;
}

.action-item {
  flex: 1;
  position: relative;
  text-align: center;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 1px;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.55);
    transform: translateY(-50%);
  }

  .action-btn {
    width: 100%;
    height: 40px;
    font-size: 12px;
    border: none;
    border-radius: 0;
    padding: 0;

    &:focus {
      box-shadow: none;
    }
  }
}
</style>
