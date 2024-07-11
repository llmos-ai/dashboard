<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { CLUSTER } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE } from '@shell/config/table-headers';

export default {
  name: 'MLClusterList',

  components: {
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = { cluster: this.$store.dispatch(`${ inStore }/findAll`, { type: CLUSTER.RAY_CLUSTER }) };

    const res = await allHash(hash);

    this.rows = res.cluster;
  },

  data() {
    return { rows: [] };
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
        label: 'Desired CPU',
        sort:  ['status.desiredCPU'],
        value: 'status.desiredCPU'
      };

      const MEMORY = {
        name:  'memory',
        label: 'Desired Memory',
        sort:  ['status.desiredMemory'],
        value: 'status.desiredMemory'
      };

      const GPU = {
        name:  'GPU',
        label: 'GPU',
        sort:  ['status.desiredGPU'],
        value: 'status.desiredGPU'
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
        AGE,
      ];

      return headers;
    },
  },
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
  </ResourceTable>
</template>
