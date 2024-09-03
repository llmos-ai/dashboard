<script>
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { STATE, AGE } from '@shell/config/table-headers';

export default {
  components: {
    ResourceTable,
    Masthead
  },
  mixins: [ResourceFetch],
  props:  {
    resource: {
      type:     String,
      required: true,
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    const store = this.$store;

    await store.dispatch(`management/findAll`, { type: MANAGEMENT.TOKEN });

    await this.$fetchType(this.resource);
  },

  data() {
    const getters = this.$store.getters;

    const schema = getters[`management/schemaFor`](this.resource);

    return { schema };
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  },

  computed: {
    headers() {
      const NAME = {
        name:  'name',
        label: 'name',
        value: 'name'
      };
      const DESCRIPTION = {
        name:  'description',
        label: 'Description',
        value: 'description'
      };

      const EXPIRES = {
        name:      'expires',
        label:     'Expires',
        value:     'expiresAt',
        formatter: 'LiveDate',
      };

      const headers = [
        STATE,
        NAME,
        DESCRIPTION,
        EXPIRES,
        AGE
      ];

      return headers;
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },
  },
};
</script>

<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    />

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :headers="headers"
      key-field="id"
      data-testid="api_keys_list"
      :group-by="groupBy"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
</template>

<style lang="scss">
</style>
