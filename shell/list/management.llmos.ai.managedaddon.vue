<script>
import ResourceTable from '@shell/components/ResourceTable';
import { MANAGEMENT } from '@shell/config/types';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { NAME, NAMESPACE, STATE } from '@shell/config/table-headers';

export default {
  name:       'ManagedAddon',
  components: { ResourceTable },
  mixins:     [ResourceFetch],
  props:      {
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

  computed: {
    headers() {
      const VERSION = {
        name:  'version',
        label: 'Version',
        value: 'version',
      };

      const DESCRIPTION = {
        name:  'description',
        label: 'Description',
        value: 'description',
      };

      const ENABLED = {
        name:  'enabled',
        label: 'Enabled',
        value: 'spec.enabled',
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        VERSION,
        DESCRIPTION,
        ENABLED,
      ];

      return headers;
    }
  },

  async fetch() {
    this.$initializeFetchData(this.resource);

    this.$fetchType(MANAGEMENT.MANAGED_ADDON);
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
    :group-by="$attrs.groupBy"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  />
</template>
