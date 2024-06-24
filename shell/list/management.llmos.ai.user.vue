<script>
import AsyncButton from '@shell/components/AsyncButton';
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  components: {
    AsyncButton,
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

    await store.dispatch(`management/findAll`, { type: MANAGEMENT.USER });

    await this.$fetchType(this.resource);
  },

  data() {
    const getters = this.$store.getters;

    const schema = getters[`management/schemaFor`](this.resource);

    return {
      schema,
    };
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  },

  computed: {
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },

    groupBy() {
      return this.$store.getters['type-map/groupByFor'](this.schema);
    },

    users() {
      return this.rows
    }
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
    >
    </Masthead>

    <ResourceTable
      :schema="schema"
      :rows="users"
      :group-by="groupBy"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>
</template>

<style lang="scss">
</style>
