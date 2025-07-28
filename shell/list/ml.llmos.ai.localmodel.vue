<script>
import Loading from '@shell/components/Loading';
import ModelGrid from '@shell/components/llmos/ModelGrid.vue';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

export default {
  name: 'LocalModelList',

  components: {
    Loading,
    ModelGrid,
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

    <ModelGrid
      v-model:current-page="currentPageNumber"
      :items="filteredRows"
      :page-size="pageSize"
      :total="filteredRows.length"
      test-id-prefix="local-model"
      default-icon="/img/generic-catalog.svg"
      description-field="spec.modelCard.description"
      fallback-description-field="spec.registry"
    />
  </div>
</template>

<style lang="scss" scoped>
.local-model-list {
  min-height: 80vh;
}
</style>
