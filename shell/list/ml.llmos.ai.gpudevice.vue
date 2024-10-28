<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { allHash } from '@shell/utils/promise';
import { STATE, AGE, VRAM } from '@shell/config/table-headers';
import { LLMOS, NODE as NODE_TYPE } from '@shell/config/types';
import CopyToClipboard from '@shell/components/CopyToClipboard.vue';
import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';

export default {
  name:       'GPUDeviceList',
  components: {
    CopyToClipboard,
    ResourceTable,
    Loading,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = { gpuDevices: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.GPUDEVICE }) };

    const res = await allHash(hash);

    this.rows = res.gpuDevices;
  },

  data() {
    return { rows: [] };
  },

  computed: {
    headers() {
      const ID = {
        name:  'id',
        label: 'Device ID',
        value: 'status.id',
      };
      const VENDOR = {
        name:  'vendor',
        label: 'Vendor',
        value: 'status.vendor',
      };

      const DEVICE_NAME = {
        name:  'device_name',
        label: 'Device Name',
        value: 'status.deviceName',
      };

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

      const STATUS = {
        name:  'status',
        label: 'Status',
        value: 'status.state'
      };

      const headers = [
        STATE,
        ID,
        NODE,
        VENDOR,
        DEVICE_NAME,
        VGPU,
        VRAM_USAGE,
        {
          ...VRAM,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.vRAMUsagePercentage
        },
        STATUS,
        AGE
      ];

      return headers;
    },
  },
  methods: {}
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
    <template #col:id="{row}">
      <td>
        <n-link :to="row.detailLocation">
          {{ row.status?.id }}
        </n-link>
        <CopyToClipboard
          label-as="tooltip"
          :text="row.status?.id"
          class="icon-btn"
          action-color="bg-transparent"
        />
      </td>
    </template>
  </ResourceTable>
</template>
