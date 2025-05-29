<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';
import { NAME, STATE, NAMESPACE, AGE } from '@shell/config/table-headers';

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

  data() {
    return {
      datasets: [],
    };
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const res = await allHash({
      datasets:        await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET }),
      datasetVersions: await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET_VERSION }),
    });

    this.datasets = res.datasets
  },

  computed: {
    headers() {
      const REGISTRY = {
        name:  'spec.registry',
        label: this.t('modelCard.registry.label')
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        REGISTRY,
        AGE,
      ];

      return headers;
    },
  },

  methods: {
    
  },

  typeDisplay() {
    return 'Data Center'
  },
};
</script>

<template>
  <ResourceTable
    :loading="loading"
    :schema="schema"
    :rows="datasets"
    :headers="headers"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    groupable
  />
</template>
