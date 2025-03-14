<script>
import ResourceTable from '@shell/components/ResourceTable';
import Tag from '@shell/components/Tag';
import { Banner } from '@components/Banner';
import {
  STATE, NAME, ROLES, INTERNAL_EXTERNAL_IP, CPU, RAM, AGE, KUBE_NODE_OS, GPU_DEVICE, VRAM_USAGE
} from '@shell/config/table-headers';
import metricPoller from '@shell/mixins/metric-poller';

import { LLMOS, METRIC, NODE, POD } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { GROUP_RESOURCES, mapPref } from '@shell/store/prefs';
// import { COLUMN_BREAKPOINTS } from '@shell/components/SortableTable/index.vue';
import { COLUMN_BREAKPOINTS } from '@shell/types/store/type-map';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListNode',
  components: {
    ResourceTable,
    Tag,
    Banner,
  },
  mixins: [metricPoller, ResourceFetch],

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
    }
  },

  async fetch() {
    this.$initializeFetchData(this.resource);

    const hash = {
      kubeNodes:  this.$fetchType(this.resource),
      gpuDevices: this.$fetchType(LLMOS.GPUDEVICE),
    };

    this.canViewPods = this.$store.getters[`cluster/schemaFor`](POD);

    if (this.canViewPods) {
      // Used for running pods metrics - we don't need to block on this to show the list of nodes
      this.$fetchType(POD);
    }

    const res = await allHash(hash);

    this.gpuDevices = res.gpuDevices;
  },

  data() {
    return {
      // Pods required for `Pods` column's running pods metrics
      // podConsumedUsage = podConsumed / podConsumedUsage. podConsumed --> pods. allPods.filter((pod) => pod.spec.nodeName === this.name)
      canViewPods:        !!this.$store.getters[`cluster/schemaFor`](POD),
      // Required for CPU and RAM columns
      canViewNodeMetrics: !!this.$store.getters['cluster/schemaFor'](METRIC.NODE),
      canViewGPUDevice:   !!this.$store.getters['cluster/schemaFor'](LLMOS.GPUDEVICE),
      gpuDevices:         [],
    };
  },

  beforeUnmount() {
    // Stop watching pods, nodes and node metrics
    if (this.canViewPods) {
      this.$store.dispatch('cluster/forgetType', POD);
    }

    if (this.canViewGPUDevice) {
      this.$store.dispatch('cluster/forgetType', LLMOS.GPUDEVICE);
    }

    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    hasWindowsNodes() {
      return (this.rows || []).some((node) => node.status.nodeInfo?.operatingSystem === 'windows');
    },

    tableGroup: mapPref(GROUP_RESOURCES),

    parsedRows() {
      this.rows.forEach((row) => {
        row.displayTaintsAndLabels = (row.spec.taints && row.spec.taints.length) || !!row.customLabelCount;
      });

      return this.rows;
    },

    headers() {
      const headers = [
        STATE,
        NAME,
        ROLES,
        INTERNAL_EXTERNAL_IP,
        {
          ...KUBE_NODE_OS,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.status?.nodeInfo?.operatingSystem
        },
        GPU_DEVICE,
        {
          ...CPU,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.cpuUsagePercentage
        }, {
          ...RAM,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.ramUsagePercentage
        }, {
          ...VRAM_USAGE,
          breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
          getValue:   (row) => row.vramUsagePercentage
        }];

      headers.push(AGE);

      return headers;
    },
  },

  methods: {
    async loadMetrics() {
      if (!this.canViewNodeMetrics) {
        return;
      }

      await this.$store.dispatch('cluster/findAll', {
        type: METRIC.NODE,
        opt:  { force: true }
      });

      this.$forceUpdate();
    },

    toggleLabels(row) {
      row['displayLabels'] = !row.displayLabels;
    },

    // count GPUs by vendor
    countGPUsByVendor(node) {
      if (!node || !this.gpuDevices) {
        return {};
      }

      return this.gpuDevices.reduce((acc, device) => {
        const vendor = device.status.vendor;

        if (vendor && device.status.nodeName === node.name) {
          acc[vendor] = (acc[vendor] || 0) + 1;
        }

        return acc;
      }, {});
    },

    getTooltipConfig(item) {
      if (!this.shown && !item) {
        return;
      }

      if (!this.shown) {
        return {
          content:       this.shown ? null : `Total: ${ item }`,
          placement:     'top',
          popperOptions: { modifiers: { preventOverflow: { enabled: false }, hide: { enabled: false } } }
        };
      } else {
        return { content: undefined };
      }
    },
  }

};
</script>

<template>
  <div>
    <Banner
      v-if="hasWindowsNodes"
      color="info"
      :label="t('cluster.custom.registrationCommand.windowsWarning')"
    />
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="parsedRows"
      :sub-rows="true"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    >
      <template #sub-row="{fullColspan, row, onRowMouseEnter, onRowMouseLeave}">
        <tr
          class="taints sub-row"
          :class="{'empty-taints': ! row.displayTaintsAndLabels}"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <template v-if="row.displayTaintsAndLabels">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td :colspan="fullColspan-2">
              <span v-if="row.spec.taints && row.spec.taints.length">
                {{ t('node.list.nodeTaint') }}:
                <Tag
                  v-for="(taint, i) in row.spec.taints"
                  :key="i"
                  class="mr-5 mt-2"
                >
                  {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
                </Tag>
              </span>
              <span
                v-if="!!row.customLabelCount"
                class="mt-5"
              > {{ t('node.list.nodeLabels') }}:
                <span
                  v-for="(label, i) in row.customLabels"
                  :key="i"
                  class="mt-5 labels"
                >
                  <Tag
                    v-if="i < 7"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                  <Tag
                    v-else-if="i > 6 && row.displayLabels"
                    class="mr-2 label"
                  >
                    {{ label }}
                  </Tag>
                </span>
                <a
                  v-if="row.customLabelCount > 7"
                  href="#"
                  @click.prevent="toggleLabels(row)"
                >
                  {{ t(`node.list.${row.displayLabels? 'hideLabels' : 'showLabels'}`) }}
                </a>
              </span>
            </td>
          </template>
          <td
            v-else
            :colspan="fullColspan"
          />
        </tr>
      </template>
      <template #col:gpu-device="{row}">
        <td>
          <div v-if="!Object.keys(countGPUsByVendor(row)).length">
            <span>N/A</span>
          </div>
          <div v-else>
            <div
              v-for="(count, vendor) in countGPUsByVendor(row)"
              :key="vendor"
            >
              <span
                v-if="vendor === 'NVIDIA'"
                class="gpu-device"
              >
                <svg
                  v-clean-tooltip="getTooltipConfig(count)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="5.1em"
                  height="1em"
                  viewBox="0 0 512 98"
                >
                  <path d="M312.805 18.394v63.838h18.015V18.394zm-141.742-.108v63.892h18.178v-49.61l14.174.054c4.653 0 7.899 1.136 10.117 3.517c2.867 3.03 4.003 7.952 4.003 16.879v29.16h17.637V46.904c0-25.21-16.068-28.618-31.757-28.618zm170.793.108v63.838h29.214c15.58 0 20.666-2.597 26.13-8.386c3.896-4.057 6.384-13.038 6.384-22.83c0-8.98-2.11-16.987-5.843-21.964c-6.6-8.927-16.23-10.658-30.62-10.658zm17.853 13.85h7.736c11.253 0 18.503 5.03 18.503 18.123s-7.25 18.177-18.503 18.177h-7.736zm-72.872-13.85l-15.04 50.583l-14.39-50.583H237.93l20.558 63.838h25.967l20.775-63.838zm125.187 63.838h18.015V18.394h-18.015zm50.529-63.838l-25.157 63.784h17.745l4.004-11.307h29.754l3.787 11.252H512l-25.373-63.73zm11.685 11.631l10.929 29.863h-22.181z" /><path
                    fill="#76b900"
                    d="M54.803 28.997v-8.764c.866-.054 1.731-.108 2.597-.108c24.02-.757 39.763 20.666 39.763 20.666S80.176 64.38 61.944 64.38c-2.434 0-4.815-.379-7.087-1.136V36.626c9.36 1.136 11.253 5.247 16.825 14.606L84.18 40.737s-9.143-11.956-24.507-11.956c-1.623-.054-3.246.054-4.869.216m0-28.997v13.092l2.597-.162c33.38-1.136 55.182 27.374 55.182 27.374S87.587 70.708 61.566 70.708c-2.273 0-4.49-.216-6.709-.595v8.115c1.84.217 3.733.379 5.572.379c24.237 0 41.765-12.389 58.753-26.996c2.813 2.272 14.336 7.736 16.717 10.117c-16.122 13.525-53.721 24.399-75.037 24.399a53 53 0 0 1-5.95-.325v11.415h92.077V0zm0 63.243v6.924c-22.397-4.003-28.619-27.32-28.619-27.32s10.766-11.902 28.619-13.85v7.574h-.054c-9.36-1.136-16.717 7.628-16.717 7.628s4.166 14.77 16.771 19.044M15.04 41.873s13.254-19.584 39.817-21.64v-7.14C25.427 15.472 0 40.357 0 40.357s14.39 41.657 54.803 45.444v-7.574C25.156 74.55 15.04 41.873 15.04 41.873"
                  />
                </svg>
              </span>
              <span v-else-if="vendor === 'AMD'">
                <svg
                  v-clean-tooltip="getTooltipConfig(count)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="4.17em"
                  height="1em"
                  viewBox="0 0 512 123"
                >
                  <path d="M120.415 114.002H91.868L83.184 93.04H35.839L27.923 114H0L42.654 8.172h30.562zM58.522 33.383L42.838 74.61h32.577zM223.386 8.172h22.976v105.83h-26.384v-65.96l-28.546 33.2h-4.03l-28.547-33.347v65.96H132.47V8.172h22.976l33.97 39.356zm89.816 0c38.624 0 58.632 24.039 58.632 53.061c0 30.415-19.239 52.769-61.453 52.769h-43.9V8.172zm-20.337 86.445h17.223c26.53 0 34.446-17.993 34.446-33.53c0-18.323-9.785-33.53-34.74-33.53h-16.93zm131.261-54.674v47.931h47.931l-34.226 34.263H389.9V74.169zM512 0v121.11l-33.273-33.273V33.273h-54.564L390.926 0z" />
                </svg>
              </span>
              <span v-else>
                <svg
                  v-clean-tooltip="getTooltipConfig(count)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#dddddd"
                    d="M2 7v1.5h1V17h1.5V7zm4 0v9h1v1h7v-1h8V7zm11.5 2a2.5 2.5 0 0 1 2.5 2.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5A2.5 2.5 0 0 1 17.5 9"
                  />
                </svg>
                {{ vendor }}
              </span>
            </div>
          </div>
        </td>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang='scss' scoped>

.labels {
  display: inline;
  flex-wrap: wrap;

  .label {
    display: inline-block;
    margin-top: 2px;
  }

}
.taints {
  td {
    padding-top:0;
    .tag {
      margin-right: 5px;
      display: inline-block;
      margin-top: 2px;
    }
  }
  &.empty-taints {
    // No taints... so hide sub-row (but not bottom-border)
    height: 0;
    line-height: 0;
    td {
      padding: 0;
    }
  }
}
</style>
