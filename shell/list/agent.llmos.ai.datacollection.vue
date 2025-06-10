<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { NAME, STATE, NAMESPACE, AGE } from '@shell/config/table-headers';

export default {
  name: 'ApplicationDataList',

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
    await allHash({ resource: await this.$fetchType(this.resource) });
  },

  computed: {
    headers() {
      const REGISTRY = {
        name:  'spec.registry',
        label: this.t('datasetCard.registry.label')
      };

      const DOCUMENT_COUNT = {
        name:  'documentCount',
        label: this.t('applicationData.documentCount.label')
      };

      const headers = [
        STATE,
        NAME,
        DOCUMENT_COUNT,
        REGISTRY,
        AGE,
      ];

      return headers;
    }
  },
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
    :groupable="false"
  />
</template>
