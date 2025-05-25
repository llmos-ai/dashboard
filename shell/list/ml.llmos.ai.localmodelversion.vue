<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';
import { NAME, STATE, NAMESPACE, AGE, STORAGE_CLASS_DEFAULT } from '@shell/config/table-headers';

export default {
  name: 'LocalModelVersionList',

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

    await allHash({
      resource:        await this.$fetchType(this.resource),
      localModels: await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.LOCAL_MODEL }),
    });
  },

  computed: {
    headers() {
      const LOCAL_MODEL = {
        name:  'spec.localModel',
        label: this.t('localModel.localModel.label')
      };

      const VOLUME_SNAPSHOT = {
        name: 'status.volumeSnapshot',
        label: this.t('localModel.volumeSnapshot.label')
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        LOCAL_MODEL,
        VOLUME_SNAPSHOT,
        AGE,
        STORAGE_CLASS_DEFAULT,
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
  />
</template>
