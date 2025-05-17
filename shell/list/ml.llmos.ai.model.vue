<script>
import Loading from '@shell/components/Loading';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';

import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name: 'ModelList',

  components: {
    Loading,
    BadgeStateFormatter,
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
    splitDataSource() {
      const rows = this.filteredRows || [];

      if (rows.length > (this.currentPageNumber - 1) * this.pageSize) {
        return rows.slice((this.currentPageNumber - 1) * this.pageSize, this.currentPageNumber * this.pageSize);
      } else {
        return rows;
      }
    },

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
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },

  methods: {
    onDeleteModel(row) {
      row.promptRemove();
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
        <div
          v-if="false"
          class="filter-label"
        >
          Model Filter
        </div>
        <a-input
          v-model:value="searchQuery"
          :aria-label="t('sortableTable.searchLabel')"
          :placeholder="t('sortableTable.search')"
          :style="{ width: '200px' }"
        />
      </a-flex>

      <a-flex
        v-if="false"
        gap="32"
        class="mb-5"
      >
        <span class="tag-label">
          Provider
        </span>
        <a-radio-group
          v-model:value="selectedProvider"
          :options="providerOptions"
          optionType="button"
          size="small"
          class="custom-radio-group"
        />
      </a-flex>

      <a-flex
        v-if="false"
        gap="32"
        class="mb-5"
      >
        <span class="tag-label">
          Type
        </span>
        <a-radio-group
          v-model:value="selectedType"
          :options="typeOptions"
          optionType="button"
          size="small"
          class="custom-radio-group"
        />
      </a-flex>

      <a-flex
        v-if="false"
        gap="32"
        class="mb-5"
      >
        <span class="tag-label">
          Tags
        </span>
        <a-radio-group
          v-model:value="selectedTag"
          :options="contextOptions"
          optionType="button"
          size="small"
          class="custom-radio-group"
        />
      </a-flex>
    </div>

    <div class="grid">
      <template v-if="splitDataSource.length === 0">
        <a-empty />
      </template>
      <template v-else>
        <div
          v-for="(row, i) in splitDataSource"
          :key="i"
          class="item"
          :data-testid="`cluster-tools-app-${row.id}`"
        >
          <div class="logo">
            <img
              class="size-[20px] mr-2"
              :src="row.iconUrl"
            >
          </div>
          <div class="name-version">
            <div>
              <router-link :to="row.detailLocation">
                <h3 class="name">
                  {{ row.metadata.name }}
                </h3>
                <div class="state ml-10">
                  <BadgeStateFormatter :row="row" />
                </div>
              </router-link>
            </div>
            <div class="tags mt-5">
              <a-tag
                v-for="tag in row.displayTags"
                :key="tag"
                color="blue"
              >
                {{ tag }}
              </a-tag>
            </div>
          </div>
          <div class="description mt-10">
            {{ row.spec.modelCard.description }}
          </div>
        </div>
      </template>
    </div>
  </div>

  <a-pagination
    v-model:current="currentPageNumber"
    :defaultPageSize="pageSize"
    :total="splitDataSource.length"
    show-less-items
    hideOnSinglePage
  />
</template>

<style lang="scss" scoped>
$margin: 10px;
$logo: 50px;

.model-list {
  min-height: 80vh;
}

.ant-pagination {
  text-align: end;
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

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1 * $margin;

  :deep(.ant-empty) {
    margin: auto;  // 让空状态组件居中显示
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .item {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .item {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .item {
      width: calc(50% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .item {
      width: calc(33.33333% - 2 * #{$margin});
    }
  }

  .item {
    display: grid;
    grid-template-areas:
      'logo name-version name-version'
      'description description description'
      'state state action';
    grid-template-columns: $logo auto min-content;
    grid-template-rows: 50px 75px 35px;
    row-gap: $margin;
    column-gap: $margin;

    margin: $margin;
    padding: $margin;
    position: relative;
    border: 1px solid var(--border);
    border-radius: calc(1.5 * var(--border-radius));

    .logo {
      grid-area: logo;
      text-align: center;
      width: $logo;
      height: $logo;
      border-radius: calc(2 * var(--border-radius));
      overflow: hidden;
      background-color: white;

      img {
        width: $logo - 4px;
        height: $logo - 4px;
        object-fit: contain;
        position: relative;
        top: 2px;
      }

      > i {
        background-color: var(--box-bg);
        border-radius: 50%;
        font-size: 32px;
        line-height: 50px;
        width: 50px;
      }
    }

    .name-version {
      grid-area: name-version;
      padding: 10px 0 0 0;
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      float: left;
      padding: 0 5px 0 0;
    }

    .state {
      grid-area: state;
    }

    .version {
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.9em;
      margin-top: 4px;
    }

    .description {
      grid-area: description;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 4;  // 控制显示行数
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(0, 0, 0, 0.65)
    }

    .description-content {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }

    .action {
      grid-area: action;
      white-space: nowrap;

      button {
        height: 30px;
      }
    }
  }
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
</style>
