<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { allHash } from '@shell/utils/promise';
import { STATE, AGE, VENDOR, DEVICE_NAME } from '@shell/config/table-headers';
import { LLMOS, NODE as NODE_TYPE, POD } from '@shell/config/types';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';

export default {
  name:       'GPUDeviceList',
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

    this.rows = res.gpuDevices;
    this.pods = res.pods;
  },

  data() {
    return {
      rows: [],
      pods: [],
    };
  },

  computed: {
    headers() {
      const ID = {
        name:  'uuid',
        label: 'Device ID',
        value: 'status.uuid',
      };
      // const VENDOR = {
      //   name:  'vendor',
      //   label: 'Vendor',
      //   value: 'status.vendor',
      // };

      // const DEVICE_NAME = {
      //   name:  'device_name',
      //   label: 'Device Name',
      //   value: 'status.devName',
      // };

      const VGPU = {
        name:  'vgpu',
        label: 'vGPU',
        value: 'vGPUCount',
      };

      const VRAM_USAGE = {
        name:     'vram_usage',
        labelKey: 'tableHeaders.vramUsage',
        value:    'vramAllocated',
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
        VGPU,
        VRAM_USAGE,
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
    :rows="rows"
    key-field="_key"
    v-on="$listeners"
  >
    <template #col:uuid="{row}">
      <td>
        <n-link :to="row.detailLocation">
          {{ row.status?.uuid }}
        </n-link>
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
