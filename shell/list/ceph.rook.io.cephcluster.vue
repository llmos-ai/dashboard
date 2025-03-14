<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import Loading from '@shell/components/Loading.vue';
import { Banner } from '@components/Banner';
import { AGE, NAME, PHASE, STATE } from '@shell/config/table-headers';
import cephConfig from '@shell/mixins/ceph-config';

export default {
  name:       'ListCephCluster',
  components: {
    ResourceTable,
    Loading,
    Banner
  },
  mixins: [ResourceFetch, cephConfig],
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
    this.clusters = await this.$fetchType(this.resource);
  },

  data() {
    return { clusters: [] };
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

    notification() {
      // TODO: link enhancement
      if (this.clusters.length === 0) {
        return {
          type: 'warning',
          msg: this.t('ceph.enableNotification', { url: this.cephAddonUrl }, true),
        };
      }

      const isReady = this.clusters.find((c) => c.metadata.name === 'llmos-ceph' && c.status?.phase === 'Ready');
      const type = isReady ? 'success' : 'warning';

      return {
        type,
        msg: this.t('ceph.notification', { status: this.clusters[0]?.status?.phase, url: this.cephAddonUrl }, 'html'),
      };
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Banner :color="notification.type">
      <span v-html="notification.msg" />
    </Banner>

    <ResourceTable
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :group-by="$attrs.groupBy"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    />
  </div>

</template>
