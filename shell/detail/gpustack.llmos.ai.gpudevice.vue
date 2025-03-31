<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import Alert from '@shell/components/Alert';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';
import {
  NAME, NAMESPACE,
  POD_RESTARTS, NODE,
  VRAM, VGPU, CORES, AGE, STATE, KEY, VALUE,
} from '@shell/config/table-headers';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import { POD } from '@shell/config/types';
import createEditView from '@shell/mixins/create-edit-view';
import { formatSi, parseSi } from '@shell/utils/units';
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import metricPoller from '@shell/mixins/metric-poller';
import { allHash } from '@shell/utils/promise';
import InfoBox from '@shell/components/InfoBox.vue';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import { NAME as LLMOS } from '@shell/config/product/llmos';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import { allDashboardsExist } from '@shell/utils/grafana';
import { hasGPUResources } from '@shell/utils/container-resource';

const GPU_DEVICE_METRICS_DETAIL_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-gpu-device-1/llmos-gpu-device?orgId=1';

export default {
  name: 'DetailGPUDevice',

  components: {
    CopyToClipboardText,
    InfoBox,
    Alert,
    ConsumptionGauge,
    Loading,
    ResourceTabs,
    Tab,
    ResourceTable,
    DashboardMetrics,
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
    const res = await allHash(hash);

    this.pods = res.pods;
    this.showMetrics = await allDashboardsExist(this.$store, this.currentCluster.id, [GPU_DEVICE_METRICS_DETAIL_URL]);
  },

  data() {
    return {
      metrics:         { vram: 0, cores: 0 },
      podTableHeaders: [
        { ...STATE },
        { ...NAME },
        { ...NAMESPACE },
        { ...VGPU },
        { ...VRAM },
        { ...CORES },
        { ...POD_RESTARTS },
        { ...NODE },
        { ...AGE },
      ],
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
      showMetrics: false,
      product:     LLMOS,
      pods:        [],
      GPU_DEVICE_METRICS_DETAIL_URL,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    deviceHealthyStatus() {
      return this.mapToStatus(this.value.status?.health);
    },

    memSiOptions() {
      return {
        increment:        1024,
        startingExponent: 2,
        suffix:           'i',
      };
    },

    podTableRows() {
      // Return an empty array if pods list, value status, or value status pods are missing
      if (!this.pods.length || !this.value?.status?.uuid || !this.value.status.pods) {
        return [];
      }

      return this.pods.filter((pod) => {
        if ((pod.spec.nodeName !== this.value.status.nodeName) || !hasGPUResources(pod.spec.containers)) {
          return false;
        }

        const devPod = this.value.status.pods.find((devPod) => {
          const [namespace, name] = devPod.name.split('/');

          return namespace && name &&
            pod.metadata.namespace === namespace &&
            pod.metadata.name === name;
        });

        // If a matching devPod is found, add calculated properties to the pod
        if (devPod) {
          pod.vram = formatSi(devPod.memReq, this.memSiOptions);
          pod.vgpu = devPod.vgpu ? parseSi(devPod.vgpu) : 1;
          pod.cores = devPod.coresReq ? `${ devPod.coresReq }%` : 'N/A';
        }

        return Boolean(devPod); // Return true only if devPod was found and modified
      });
    },

    statusInfo() {
      const status = this.value.status;

      if (!status) {
        return {};
      }

      const info = {
        status:   this.value.deviceStatus,
        uuid:     status.uuid,
        vendor:   status.vendor,
        devName:  status.devName,
        vRAM:     formatSi(status.vram, this.memSiOptions),
        vGPU:     this.value.vGPUCount,
        nodeName: status.nodeName,
        index:    status.index,
      };

      const t = this.$store.getters['i18n/exists'];

      return Object.keys(info).map((key) => ({
        label: t(`gpuDevice.detail.info.key.${ key }`) ? this.t(`gpuDevice.detail.info.key.${ key }`) : key,
        key,
        value: info[key]
      }));
    },

    gpuGraphVars() {
      return {
        instance: this.value.status?.internalIP,
        gpu:      this.value.status?.index,
      };
    },
  },

  methods: {
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
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="node"
  >
    <InfoBox class="mt-10 device-detail-box">
      <h3>{{ t('gpuDevice.detail.info.label') }}</h3>
      <div class="device-detail">
        <ul class="device-detail-info">
          <template
            v-for="(info, i) in statusInfo"
            :key="i"
          >
            <li>
              <div v-if="info.key === 'uuid'">
                <span class="label">{{ info.label }}:</span>
                <span class="value">
                  <CopyToClipboardText :text="info.value" />
                </span>
              </div>
              <div v-else-if="info.key === 'status'">
                <span class="label">{{ info.label }}:</span>
                <span class="value"> <Alert
                  class="mr-10"
                  :status="deviceHealthyStatus"
                  :message="t('gpuDevice.detail.health')"
                />
                </span>
              </div>
              <div v-else-if="info.key === 'nodeName'">
                <span class="label">{{ info.label }}:</span>
                <span class="value"> <LinkName
                  type="node"
                  :value="info.value"
                  :object-id="info.value"
                  :product="product"
                  :show-type="true"
                />
                </span>
              </div>
              <div v-else>
                <span class="label">{{ info.label }}:</span>
                <span class="value">{{ info.value }}</span>
              </div>
            </li>
          </template>
        </ul>
      </div>
    </InfoBox>
    <div class="spacer-small" />
    <div class="mb-10 resources">
      <ConsumptionGauge
        :resource-name="t('gpuDevice.detail.consumptionGauge.vram')"
        :capacity="value.vramCapacity"
        :used="value.vramUsage"
        units="GiB"
        :number-formatter="vramFormatter"
      />
    </div>
    <div class="spacer" />
    <ResourceTabs
      :value="value"
      :mode="mode"
    >
      <Tab
        name="pods"
        :label="t('gpuDevice.detail.tab.pods')"
        :weight="4"
      >
        <ResourceTable
          key-field="_key"
          :headers="podTableHeaders"
          :rows="podTableRows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="showMetrics"
        :label="t('gpuDevice.detail.tab.metrics')"
        name="node-gpu-metrics"
        :weight="3"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="GPU_DEVICE_METRICS_DETAIL_URL"
            :has-summary-and-detail="false"
            :vars="gpuGraphVars"
            graph-height="825px"
          />
        </template>
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
.device-detail-box {
  padding: 1.2rem;
}

.device-detail{
  display: flex;
  height: 100%;
  gap: 3.2rem;
  margin-top: 1.2rem;

  .device-detail-info {
    margin: 0;
    padding: 0;
    gap: 15px;
    display: grid;
    grid-template-columns: 3fr 2fr;
    list-style: none;

    .label {
      display: inline-block;
      width: 6.5rem;
      height: 1.2rem;
      color: #939ea9;
    }

    .value {
      a {
        color: var(--color-link);
      }
      a:hover{
        text-decoration: none;
      }
    }
  }
}
</style>
