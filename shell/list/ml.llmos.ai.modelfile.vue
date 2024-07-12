<script>
import ResourceTable from '@shell/components/ResourceTable';
import { ML_CLUSTER } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
export default {
  name:       'Modelfiles',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

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
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
  },
  computed: {
    filteredRows() {
      return this.rows;
    }
  },
  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    return {
      loadResources:     [ML_CLUSTER.MODEL_FILE],
      loadIndeterminate: true, // results are filtered so we wouldn't get the correct count on indicator...
    };
  },
};
</script>

<template>
  <ResourceTable
    :schema="schema"
    :rows="filteredRows"
    :headers="$attrs.headers"
    :group-by="$attrs.groupBy"
    :loading="loading"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
