<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import Loading from '@shell/components/Loading.vue';
import { AGE, NAME, PHASE, STATE } from '@shell/config/table-headers';
import { LLMOS } from '@shell/config/types';

export default {
  name:       'ListCephCluster',
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
          name:  'dataDirHostPath',
          label: 'Data Directory Host Path',
          value: 'spec.dataDirHostPath'
        },
        {
          name:  'health',
          label: 'Health',
          value: 'status.ceph.health',
        },
        {
          name:  'message',
          label: 'Message',
          value: 'status.message',
        },
        {
          name:  'fsid',
          label: 'FSID',
          value: 'status.ceph.fsid'
        },
        PHASE,
        AGE,
      ];

      return headers;
    },

    hasCephClusters() {
      const clusters = this.$store.getters['cluster/all'](LLMOS.CEPH_CLUSTER);

      return clusters.length > 0;
    },

    notification() {
      // if (this.hasCephClusters) {
      //   return null
      // }
      const clusters = this.$store.getters['cluster/all'](LLMOS.CEPH_CLUSTER);

      if (clusters.length === 0) {
        return {
          type: 'warning',
          html: this.t('ceph.enableNotification', null, 'html'),
        };
      }

      const isReady = clusters.every((c) => c.status?.phase === 'Ready');

      if (isReady) {
        return null;
      }

      return {
        type: 'warning',
        html: this.t('ceph.progressingNotification', null, 'html'),
      };
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
    :notification="notification"
  />
</template>
