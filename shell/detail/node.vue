<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Alert from '@shell/components/Alert';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';
import {
  EFFECT,
  IMAGE_SIZE,
  KEY,
  SIMPLE_NAME,
  VALUE
} from '@shell/config/table-headers';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import { LLMOS, METRIC, POD } from '@shell/config/types';
import createEditView from '@shell/mixins/create-edit-view';
import { formatSi, exponentNeeded, UNITS } from '@shell/utils/units';
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import metricPoller from '@shell/mixins/metric-poller';
import { allHash, setPromiseResult } from '@shell/utils/promise';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import { allDashboardsExist } from '@shell/utils/grafana';

const NODE_METRICS_DETAIL_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-node-detail-1/llmos-node-detail?orgId=1';
const NODE_METRICS_SUMMARY_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-node-1/llmos-node?orgId=1';
const NODE_GPU_METRICS_DETAIL_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-gpu-node-detail-1/llmos-gpu-node-detail?orgId=1';
const NODE_GPU_METRICS_SUMMARY_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-gpu-node-1/llmos-gpu-node?orgId=1';

const TAB_WEIGHT_MAP = {
  pods:        99,
  metrics:     98,
  info:        80,
  gpus:        71,
  gpusMetrics: 70,
  tains:       60,
  images:      50,
};

export default {
  name:       'DetailNode',
  components: {
    Alert,
    ConsumptionGauge,
    DashboardMetrics,
    Loading,
    ResourceTabs,
    Tab,
    ResourceTable,
  },

  mixins: [createEditView, metricPoller],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = { pods: this.$store.dispatch(`${ inStore }/findAll`, { type: POD }) };

    this.canViewGpuDevices = this.$store.getters[`${ inStore }/schemaFor`](LLMOS.GPUDEVICE);
    if (this.canViewGpuDevices) {
      hash.gpuDevices = this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.GPUDEVICE });
    }

    await allHash(hash);

    setPromiseResult(
      allDashboardsExist(this.$store, this.currentCluster.id, [NODE_GPU_METRICS_DETAIL_URL, NODE_GPU_METRICS_SUMMARY_URL]),
      this,
      'showNodeGpuMetrics',
      'Determine node gpu metrics'
    );

    this.showMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [NODE_METRICS_DETAIL_URL, NODE_METRICS_SUMMARY_URL]);
  },

  data() {
    const podSchema = this.$store.getters['cluster/schemaFor'](POD);
    const gpuDeviceSchema = this.$store.getters['cluster/schemaFor'](LLMOS.GPUDEVICE);

    let gpuDeviceTableHeaders;

    if (gpuDeviceSchema) {
      gpuDeviceTableHeaders = this.$store.getters['type-map/headersFor'](gpuDeviceSchema);
    }

    return {
      metrics:          { cpu: 0, memory: 0 },
      infoTableHeaders: [
        {
          ...KEY,
          label: '',
          width: 200
        },
        {
          ...VALUE,
          label:       '',
          dashIfEmpty: true,
        }
      ],
      imageTableHeaders: [
        { ...SIMPLE_NAME, width: null },
        { ...IMAGE_SIZE, width: 100 } // Ensure one header has a size, all other columns will scale
      ],
      taintTableHeaders: [
        KEY,
        VALUE,
        EFFECT
      ],
      podTableHeaders:   this.$store.getters['type-map/headersFor'](podSchema),
      gpuDeviceTableHeaders,
      NODE_METRICS_DETAIL_URL,
      NODE_METRICS_SUMMARY_URL,
      NODE_GPU_METRICS_SUMMARY_URL,
      NODE_GPU_METRICS_DETAIL_URL,
      showMetrics:       false,
      canViewGpuDevices: false,
      tabWeightMap:      TAB_WEIGHT_MAP,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    memoryUnits() {
      const exponent = exponentNeeded(this.value.ramReserved, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    pidPressureStatus() {
      return this.mapToStatus(this.value.isPidPressureOk);
    },

    diskPressureStatus() {
      return this.mapToStatus(this.value.isDiskPressureOk);
    },

    memoryPressureStatus() {
      return this.mapToStatus(this.value.isMemoryPressureOk);
    },

    kubeletStatus() {
      return this.mapToStatus(this.value.isKubeletOk);
    },

    infoTableRows() {
      return Object.keys(this.value.status.nodeInfo)
        .map((key) => ({
          key:   this.t(`node.detail.tab.info.key.${ key }`),
          value: this.value.status.nodeInfo[key]
        }));
    },

    imageTableRows() {
      const images = this.value.status.images || [];

      return images.map((image) => ({
        // image.names[1] typically has the user friendly name but on occasion there's only one name and we should use that
        name:      image.names ? (image.names[1] || image.names[0]) : '---',
        sizeBytes: image.sizeBytes
      }));
    },

    taintTableRows() {
      return this.value.spec.taints || [];
    },

    graphVars() {
      return { instance: `${ this.value.internalIp }:9100` };
    },
    gpuGraphVars() {
      return { instance: `${ this.value.internalIp }` };
    },

    nodeGpus() {
      if (!this.canViewGpuDevices) {
        return [];
      }

      return this.$store.getters['cluster/all'](LLMOS.GPUDEVICE).filter((gpu) => gpu.status.nodeName === this.value.name);
    },

    hasGPUs() {
      return this.nodeGpus.length > 0;
    }
  },

  methods: {
    memoryFormatter(value) {
      const formatOptions = {
        addSuffix: false,
        increment: 1024,
      };

      return formatSi(value, formatOptions);
    },

    vramFormatter(value) {
      const formatOptions = {
        addSuffix: false,
        increment: 1024,
      };

      return formatSi(value, formatOptions);
    },

    mapToStatus(isOk) {
      return isOk ? 'success' : 'error';
    },

    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/find', {
          type: METRIC.NODE,
          id:   this.value.id,
          opt:  {
            force: true,
            watch: false,
          }
        });

        this.$forceUpdate();
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="node"
  >
    <div class="spacer" />
    <div class="alerts">
      <Alert
        class="mr-10"
        :status="pidPressureStatus"
        :message="t('node.detail.glance.pidPressure')"
      />
      <Alert
        class="mr-10"
        :status="diskPressureStatus"
        :message="t('node.detail.glance.diskPressure')"
      />
      <Alert
        class="mr-10"
        :status="memoryPressureStatus"
        :message="t('node.detail.glance.memoryPressure')"
      />
      <Alert
        :status="kubeletStatus"
        :message="t('node.detail.glance.kubelet')"
      />
    </div>
    <div class="mt-20 resource-gauges">
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.cpu')"
        :capacity="value.cpuCapacity"
        :used="value.cpuUsage"
      />
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.memory')"
        :capacity="value.ramReserved"
        :used="value.ramUsage"
        :units="memoryUnits"
        :number-formatter="memoryFormatter"
      />
      <ConsumptionGauge
        v-if="hasGPUs"
        :resource-name="t('node.detail.glance.consumptionGauge.vram')"
        :capacity="value.vramCapacity"
        :used="value.vramUsage"
        units="GiB"
        :number-formatter="vramFormatter"
      />
      <ConsumptionGauge
        :resource-name="t('node.detail.glance.consumptionGauge.pods')"
        :capacity="value.podCapacity"
        :used="value.podConsumed"
      />
    </div>
    <div class="spacer" />
    <ResourceTabs
      :value="value"
      :mode="mode"
    >
      <Tab
        name="info"
        :label="t('node.detail.tab.info.label')"
        class="bordered-table"
        :weight="tabWeightMap.info"
      >
        <ResourceTable
          key-field="_key"
          :headers="infoTableHeaders"
          :rows="infoTableRows"
          :row-actions="false"
          :table-actions="false"
          :show-headers="false"
          :search="false"
        />
      </Tab>
      <Tab
        name="pods"
        :label="t('node.detail.tab.pods')"
        :weight="tabWeightMap.pods"
      >
        <ResourceTable
          key-field="_key"
          :headers="podTableHeaders"
          :rows="value.pods"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="showMetrics"
        :label="t('node.detail.tab.metrics')"
        name="node-metrics"
        :weight="tabWeightMap.metrics"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="NODE_METRICS_DETAIL_URL"
            :summary-url="NODE_METRICS_SUMMARY_URL"
            :vars="graphVars"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab
        v-if="hasGPUs"
        name="gpus"
        :label="t('node.detail.tab.gpus')"
        :weight="tabWeightMap.gpus"
      >
        <ResourceTable
          key-field="_key"
          :headers="gpuDeviceTableHeaders"
          :rows="nodeGpus"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="showMetrics && hasGPUs"
        :label="t('node.detail.tab.gpuMetrics')"
        name="node-gpu-metrics"
        :weight="tabWeightMap.gpusMetrics"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="NODE_GPU_METRICS_DETAIL_URL"
            :summary-url="NODE_GPU_METRICS_SUMMARY_URL"
            :vars="gpuGraphVars"
            graph-height="825px"
          />
        </template>
      </Tab>
      <Tab
        name="images"
        :label="t('node.detail.tab.images')"
        :weight="tabWeightMap.images"
      >
        <ResourceTable
          key-field="_key"
          :headers="imageTableHeaders"
          :rows="imageTableRows"
          :row-actions="false"
          :table-actions="false"
        />
      </Tab>
      <Tab
        name="taints"
        :label="t('node.detail.tab.taints')"
        :weight="tabWeightMap.tains"
      >
        <ResourceTable
          key-field="_key"
          :headers="taintTableHeaders"
          :rows="taintTableRows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
</style>
