<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { NAME, STATE } from '@shell/config/table-headers';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

export default {
  name: 'ModelRegistryList',

  components: { ResourceTable },

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

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const res = await allHash({
      resource:        await this.$fetchType(this.resource),
      datasetVersions: await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET_VERSION }),
    });
  }
};
</script>

<template>
  <ResourceTable
    :loading="loading"
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
