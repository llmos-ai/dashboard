<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { allHash } from '@shell/utils/promise';
import {
  STATE, AGE, VENDOR, DEVICE_NAME, DEVICE_INDEX, VRAM_ALLOCATED
} from '@shell/config/table-headers';
import { LLMOS, NODE as NODE_TYPE, POD } from '@shell/config/types';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'GPUDeviceList',
  mixins:     [ResourceFetch],
  components: {
    CopyToClipboard,
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = {
      gpuDevices: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.GPUDEVICE }),
      pods:       this.$store.dispatch(`${ inStore }/findAll`, { type: POD })
    };

    const res = await allHash(hash);

    this.gpuDevices = res.gpuDevices;
    this.pods = res.pods;
  },

  data() {
    return {
      gpuDevices: [],
      pods:       [],
    };
  },

  computed: {
    headers() {
      const ID = {
        name:  'uuid',
        label: 'Device ID',
        value: 'status.uuid',
      };
      const VGPU = {
        name:  'vgpu',
        label: 'vGPU',
        value: 'vGPUCount',
      };

      const NODE = {
        name:          'node',
        labelKey:      'tableHeaders.node',
        value:         'status.nodeName',
        sort:          'status.nodeName',
        formatter:     'LinkName',
        formatterOpts: { type: NODE_TYPE },
      };

      const headers = [
        STATE,
        ID,
        NODE,
        VENDOR,
        DEVICE_NAME,
        DEVICE_INDEX,
        VGPU,
        VRAM_ALLOCATED,
        AGE
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
    :headers="headers"
    :groupable="true"
    :rows="gpuDevices"
    key-field="_key"
    :namespaced="false"
  >
    <template #col:uuid="{row}">
      <td>
        <router-link :to="row.detailLocation">
          {{ row.status?.uuid }}
        </router-link>
        <CopyToClipboard
          label-as="tooltip"
          :text="row.status?.uuid"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </td>
    </template>
  </ResourceTable>
</template>
