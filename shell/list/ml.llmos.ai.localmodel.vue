<script>
import Loading from '@shell/components/Loading';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

export default {
  name: 'LocalModelList',

  components: {
    Loading,
    BadgeStateFormatter,
    LiveDate,
    ActionMenu,
  },

  mixins: [ResourceFetch],

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
    };
  },

  async fetch() {
    await allHash({
      resource:           await this.$fetchType(this.resource),
      localModelVersions: this.$store.dispatch(`${ this.inStore }/findAll`, { type: LLMOS.LOCAL_MODEL_VERSION }),
      models:             this.$store.dispatch(`${ this.inStore }/findAll`, { type: LLMOS.MODEL }),
    });
  },

  computed: {
    filteredRows() {
      if (!this.searchQuery) {
        return this.rows;
      }

      const query = this.searchQuery.toLowerCase();

      return this.rows.filter((row) => {
        return (
          row.id?.toLowerCase().includes(query) ||
          row.spec?.registry?.toLowerCase().includes(query) ||
          row.spec?.modelCard?.description?.toLowerCase().includes(query)
        );
      });
    },

    splitDataSource() {
      const start = (this.currentPageNumber - 1) * this.pageSize;
      const end = start + this.pageSize;

      return this.filteredRows.slice(start, end);
    },
  },
};
</script>

<template>
  <Loading v-if="loading" />
  <div
    v-else
    class="local-model-list"
  >
    <div>
      <a-flex
        class="mb-10"
        justify="flex-end"
      >
        <span />
        <a-input
          v-model:value="searchQuery"
          :placeholder="t('sortableTable.search')"
          :style="{ width: '200px' }"
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
          :data-testid="`local-model-${row.id}`"
        >
          <div class="logo">
            <img
              class="size-[20px] mr-2"
              :src="row.iconUrl || '/img/generic-catalog.svg'"
            >
          </div>
          <div class="name-version">
            <div class="d-flex">
              <router-link :to="row.detailLocation">
                <h3 class="name">
                  {{ row.id }}
                </h3>
              </router-link>
              <div class="state">
                <BadgeStateFormatter :row="row" />
              </div>
            </div>
            <div class="text-muted">
              <LiveDate
                :value="row.creationTimestamp"
                :add-suffix="true"
                :show-tooltip="false"
              />
            </div>
          </div>
          <div class="action">
            <ActionMenu
              :resource="row"
            />
          </div>
          <div class="description mt-10">
            {{ row.spec.modelCard?.description || row.spec.registry }}
          </div>
        </div>
      </template>
    </div>
  </div>

  <a-pagination
    v-model:current="currentPageNumber"
    :defaultPageSize="pageSize"
    :total="filteredRows.length"
    show-less-items
    hideOnSinglePage
  />
</template>

<style lang="scss" scoped>
$margin: 10px;
$logo: 50px;

.local-model-list {
  min-height: 80vh;
}

.ant-pagination {
  text-align: end;
}

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1 * $margin;

  :deep(.ant-empty) {
    margin: auto;
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
      'logo name-version action'
      'description description description';
    grid-template-columns: $logo auto min-content;
    grid-template-rows: 50px 115px;
    row-gap: 5px;
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
      padding: 5px 0 0 0;

      .d-flex {
        display: flex;
        align-items: center;
      }
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      padding: 0 10px 0 0;
    }

    .state {
      display: flex;
      align-items: center;
    }

    .description {
      padding-left: 10px;
      padding-right: 10px;
      grid-area: description;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 5;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
      line-height: 1.5;
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
</style>
