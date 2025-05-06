<script>
import { debounce } from 'lodash';

import ResourceTable from '@shell/components/ResourceTable';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';

import ResourceFetch from '@shell/mixins/resource-fetch';

import { NAME, STATE } from '@shell/config/table-headers';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'ModelList',

  components: { 
    ResourceTable,
    LazyImage, 
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
      pageSize: 9,
      searchQuery: '',
      searchContext: '',
      selectedTag: '',
      selectedType: '',
      selectedProvider: '',
    }
  },

  computed: {
    splitDataSource() {
      console.log(this.pagination, 'pagination')
      console.log(this.namespaceFilter, 'namespaceFilter')
      const rows = this.filteredRows || [];

      if (rows.length > (this.currentPageNumber - 1) * this.pageSize) {
        return rows.slice((this.currentPageNumber - 1) * this.pageSize, this.currentPageNumber * this.pageSize);
      } else {
        return rows;
      }
    },

    // filteredRows() {
    //   const rows = this.filterTagRows || []

    //   if (this.searchQuery) {
    //     return rows.filter((row) => {
    //       return row.metadata.name.toLowerCase().includes(this.searchQuery.toLowerCase());
    //     });
    //   }

    //   return rows;
    // },

    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces'];

      // Do we need to filter by namespace like things?
      if (
        !this.isNamespaced || // Resource type isn't namespaced
        this.ignoreFilter || // Component owner strictly states no filtering
        this.externalPaginationEnabled ||
        (isAll && !this.currentProduct?.hideSystemResources) || // Need all
        (this.inStore ? this.$store.getters[`${ this.inStore }/haveNamespace`](this.schema.id)
          ?.length : false) // Store reports type has namespace filter, so rows already contain the correctly filtered resources
      ) {
        return this.rows || [];
      }

      const includedNamespaces = this.$store.getters['namespaces']();

      // Shouldn't happen, but does for resources like management.cattle.io.preference
      if (!this.rows) {
        return [];
      }

      const haveAllNamespace = this.$store.getters['haveAllNamespace'];

      return this.rows.filter((row) => {
        if (this.currentProduct?.hideSystemResources && this.isNamespaced) {
          return (
            !!includedNamespaces[row.metadata.namespace] &&
            !row.isSystemResource
          );
        } else if (!this.isNamespaced) {
          return true;
        } else if (haveAllNamespace) {
          // `rows` only contains resource from a single namespace
          return true;
        } else {
          return !!includedNamespaces[row.metadata.namespace];
        }
      });
    },

    filterTagRows() {
      const rows = this.rows || [];

      if (this.selectedTag) {
        return rows.filter((row) => {
          console.log(row.spec.modelCard.metadata.tags, 'row.spec.modelCard.metadata.tags')
          console.log(this.selectedTag, 'selectedTag')
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
      }]
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
      }]
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
      }]
    },
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },

  methods: {
    onDeleteModel(row) {
      row.promptRemove()
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div class="model-list">
    <a-flex 
      class="mb-10"
      justify="space-between"
    >
      <div class="filter-label">
        Model Filter
      </div>
      <a-input
        v-model:value="searchQuery"
        :aria-label="t('sortableTable.searchLabel')"
        :placeholder="t('sortableTable.search')"
        :style="{ width: '200px' }"
      />
    </a-flex>

    <a-flex gap="32" class="mb-5">
      <span class="tag-label">
        Provider
      </span>
      <a-radio-group 
        v-model:value="selectedProvider" 
        :options="providerOptions" 
        optionType="button"
        size="small"
      />
    </a-flex>

    <a-flex gap="32" class="mb-5">
      <span class="tag-label">
        Type
      </span>
      <a-radio-group 
        v-model:value="selectedType" 
        :options="typeOptions" 
        optionType="button"
        size="small"
      />
    </a-flex>

    <a-flex gap="32" class="mb-5">
      <span class="tag-label">
        Tags
      </span>
      <a-radio-group 
        v-model:value="selectedTag" 
        :options="contextOptions" 
        optionType="button"
        size="small"
      />
    </a-flex>

    <div class="grid">
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
            <router-link :to="row.editUrl">
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
              color="blue"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
        <div class="description mt-10">
          {{ row.spec.modelCard.description }}
        </div>
        <div class="action">
          <router-link :to="row.detailLocation">
            <a-button
              type="primary"
              size="small"
            > 
              Upload
            </a-button>
          </router-link>
          <a-button
            danger
            size="small"
            @click="onDeleteModel(row)"
          > 
            {{ t('asyncButton.delete.action') }}
          </a-button>
        </div>
      </div>
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
</style>
