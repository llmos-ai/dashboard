<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE, NAMESPACE } from '@shell/config/table-headers';
import { SERVICE, LLMOS, MANAGEMENT } from '@shell/config/types';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';

export default {
  name: 'ModelServiceList',

  components: {
    CopyToClipboard, ResourceTable, Loading
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = {
      modelServices:    this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.MODEL_SERVICE }),
      services:         this.$store.dispatch(`${ inStore }/findAll`, { type: SERVICE }),
      serverURLSetting: this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: 'server-url' })
    };

    const res = await allHash(hash);

    this.rows = res.modelServices;
    this.services = res.services;
    this.serverURL = res.serverURLSetting.value;
  },

  data() {
    return {
      rows:      [],
      services:  [],
      serverURL: '',
    };
  },

  computed: {
    headers() {
      const URL = {
        name:  'url',
        label: 'API URL',
      };

      const MODEL = {
        name:  'model',
        label: 'Model Name',
        sort:  ['model'],
        value: 'modelName',
      };

      const INTERNAL_URL = {
        name:  'internal_url',
        label: 'Internal URL',
      };

      const READY = {
        name:  'ready',
        label: 'Ready',
        value: 'readyReplicas'
      };

      const STATUS = {
        name:  'status',
        label: 'Status',
        value: 'stateStatus'
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        URL,
        MODEL,
        INTERNAL_URL,
        READY,
        STATUS,
        AGE
      ];

      return headers;
    },
  },
  methods: {
    getAPIUrl(row) {
      // find service by svc name and namespace
      const svc = this.services.find((s) => {
        return s.metadata.ownerReferences?.find((o) => o.uid === row.metadata.uid);
      });

      if (!svc) {
        return 'URL not found';
      }

      const serverURL = this.serverURL || window.location.origin;
      const url = new URL(serverURL);

      const port = svc.spec.ports[0];

      switch (svc.spec.type) {
      case 'NodePort':
        return `http://${ url.hostname }:${ port.nodePort }/v1`;
      case 'LoadBalancer':
        return `http://${ url.hostname }:${ port.port }/v1`;
      default:
        return `${ serverURL }/api/v1/namespaces/${ svc.namespace }/services/${ svc.name }:${ port.name }/proxy/v1`;
      }
    },

    getInternalUrl(row) {
      const svc = this.services.find((s) => {
        return s.metadata?.ownerReferences?.find((o) => o.uid === row.metadata.uid);
      });

      if (!svc) {
        return 'URL not found';
      }

      return `http://${ svc.metadata.name }.${ svc.metadata.namespace }.svc.cluster.local:${ svc.spec.ports[0].port }/v1`;
    }
  }
};

</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :groupable="true"
    :rows="rows"
    key-field="_key"
    v-on="$listeners"
  >
    <template #col:url="{row}">
      <td>
        <CopyToClipboard
          label-as="tooltip"
          :text="getAPIUrl(row)"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </td>
    </template>
    <template #col:model="{row}">
      <td>
        {{ row.spec?.model }}
        <CopyToClipboard
          label-as="tooltip"
          :text="row.spec?.model"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </td>
    </template>
    <template #col:internal_url="{row}">
      <td>
        <CopyToClipboard
          label-as="tooltip"
          :text="getInternalUrl(row)"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </td>
    </template>
  </ResourceTable>
</template>
