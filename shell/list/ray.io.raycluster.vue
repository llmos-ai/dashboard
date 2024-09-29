<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { LLMOS, MANAGEMENT, SERVICE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE } from '@shell/config/table-headers';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';

export default {
  name: 'MLClusterList',

  components: {
    CopyToClipboard,
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = {
      cluster:          this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.RAY_CLUSTER }),
      services:         this.$store.dispatch(`${ inStore }/findAll`, { type: SERVICE }),
      serverURLSetting: this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: 'server-url' })
    };

    const res = await allHash(hash);

    this.rows = res.cluster;
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
      const ACCESS = {
        name:  'access',
        label: 'Access',
      };

      const RAY_VERSION = {
        name:  'rayVersion',
        label: 'Cluster Version',
        sort:  ['spec.rayVersion'],
        value: 'spec.rayVersion',
      };

      const WORKER_NODES = {
        name:  'workerNodes',
        label: 'Worker Nodes',
        sort:  ['status.desiredWorkerReplicas'],
        value: 'status.desiredWorkerReplicas'
      };

      const CPU = {
        name:  'cpu',
        label: 'CPU',
        sort:  ['status.desiredCPU'],
        value: 'status.desiredCPU'
      };

      const MEMORY = {
        name:  'memory',
        label: 'Memory',
        sort:  ['status.desiredMemory'],
        value: 'status.desiredMemory'
      };

      const GPU = {
        name:  'gpu',
        label: 'GPUs',
        sort:  ['status.desiredGPU'],
        value: 'status.desiredGPU'
      };

      const URL = {
        name:  'url',
        label: 'Endpoint URL',
      };

      const headers = [
        STATE,
        NAME,
        ACCESS,
        RAY_VERSION,
        CPU,
        MEMORY,
        GPU,
        WORKER_NODES,
        URL,
        AGE,
      ];

      return headers;
    },
  },
  methods: {
    getInternalUrl(row) {
      // find service by svc name and namespace
      const svc = this.services.find((s) => {
        return s.metadata.ownerReferences?.find((o) => o.uid === row.metadata.uid);
      });

      if (!svc) {
        return 'Service not found';
      }

      const originUrl = window.location.origin;
      const serverURL = this.serverURL || originUrl;
      const url = new URL(serverURL);

      const port = svc.spec.ports.find((p) => p.port === 8265);

      switch (svc.spec.type) {
      case 'NodePort':
        return `http://${ url.hostname }:${ port.nodePort }`;
      case 'LoadBalancer':
        return `http://${ url.hostname }:${ port.port }`;
      default:
        return `${ originUrl }/api/v1/namespaces/${ svc.namespace }/services/${ svc.name }:${ port.name }/proxy/`;
      }
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :groupable="true"
    :headers="headers"
    :rows="rows"
    key-field="_key"
    v-on="$listeners"
  >
    <template #col:rayVersion="{row}">
      <td>
        <span>{{ row.rayVersion }}</span>
      </td>
    </template>

    <template #col:access="{row}">
      <td>
        <n-link
          class="icon "
          :to="{ name: 'c-cluster-product-resource-namespace-id-rayDashboard', params: { clusterName: row.name, resource: row.type, namespace: row.namespace, id: row.metadata?.name }}"
        >
          Manage <i class="icon icon-external-link" />
        </n-link>
      </td>
    </template>

    <template #col:workerNodes="{row}">
      <td>
        <span>{{ row.status?.availableWorkerReplicas || 0 }}/{{ row.status?.desiredWorkerReplicas || 0 }}</span>
      </td>
    </template>

    <template #col:url="{row}">
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
