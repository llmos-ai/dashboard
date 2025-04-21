<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { NAME, STATE } from '@shell/config/table-headers';

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

  computed: {
    headers() {
      const ENDPOINT = {
        name:  'spec.s3Config.endpoint',
        label: this.t('modelRegistry.endpoint.label')
      };

      const BUCKET = {
        name:  'spec.s3Config.bucket',
        label: this.t('modelRegistry.bucket.label')
      };

      const headers = [
        STATE,
        NAME,
        ENDPOINT,
        BUCKET,
      ];

      return headers;
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);
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
