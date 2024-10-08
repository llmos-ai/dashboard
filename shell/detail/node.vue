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
import { METRIC, POD } from '@shell/config/types';
import createEditView from '@shell/mixins/create-edit-view';
import { formatSi, exponentNeeded, UNITS } from '@shell/utils/units';
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import metricPoller from '@shell/mixins/metric-poller';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'DetailNode',

  components: {
    Alert,
    ConsumptionGauge,
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

    await allHash(hash);
  },

  data() {
    const podSchema = this.$store.getters['cluster/schemaFor'](POD);

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
      podTableHeaders: this.$store.getters['type-map/headersFor'](podSchema),
      showMetrics:     false
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
      return { instance: `${ this.value.internalIp }:9796` };
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
    <div class="mt-20 resources">
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
        :resource-name="t('node.detail.glance.consumptionGauge.pods')"
        :capacity="value.podCapacity"
        :used="value.podConsumed"
      />
    </div>
    <div class="spacer" />
    <ResourceTabs
      v-model="value"
      :mode="mode"
    >
      <Tab
        name="pods"
        :label="t('node.detail.tab.pods')"
        :weight="4"
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
        :weight="3"
      />
      <Tab
        name="info"
        :label="t('node.detail.tab.info.label')"
        class="bordered-table"
        :weight="2"
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
        name="images"
        :label="t('node.detail.tab.images')"
        :weight="1"
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
        :weight="0"
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
.resources {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > * {
    width: 30%;
  }
}
</style>
