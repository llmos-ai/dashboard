<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import Loading from '@shell/components/Loading.vue';
import { AGE, NAME, PHASE, STATE } from '@shell/config/table-headers';

export default {
  name:       'ListCephFilesystem',
  components: {
    ResourceTable,
    Loading,
  },
  mixins: [ResourceFetch],
  props:  {
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
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },

  computed: {
    headers() {
      const headers = [
        STATE,
        NAME,
        {
          name:  'activeMds',
          label: 'Active MDS',
          value: 'spec.metadataServer.activeCount'
        },
        PHASE,
        AGE,
      ];

      return headers;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :group-by="$attrs.groupBy"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
