<script>
import ResourceSummary from '@shell/components/ResourceSummary';
import {
  NAMESPACE, MANAGEMENT, NODE, COUNT, LLMOS, PVC, ML_WORKLOAD_TYPES, CEPH
} from '@shell/config/types';
import { VIEW_CONTAINER_DASHBOARD } from '@shell/store/prefs';
import { mapGetters } from 'vuex';
import { allHash, setPromiseResult } from '@shell/utils/promise';
import { Banner } from '@components/Banner';
import { getCephClusterAddonUrl } from '@shell/utils/url';
import { isAdminUser } from '@shell/store/type-map';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import { allDashboardsExist } from '@shell/utils/grafana';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';

const CLUSTER_METRICS_DETAIL_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-cluster-nodes-1/llmos-cluster-nodes?orgId=1';
const CLUSTER_METRICS_SUMMARY_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-cluster-1/llmos-cluster?orgId=1';
const CLUSTER_GPU_METRICS_DETAIL_URL = '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-gpu-cluster-nodes-1/llmos-gpu-cluster-nodes?orgId=1';

export default {
  components: {
    ResourceSummary,
    DashboardMetrics,
    Tab,
    Tabbed,
    Banner,
  },

  async fetch() {
    if (this.isAdmin) {
      this.cephClusters = await this.$store.dispatch('management/findAll', { type: CEPH.CEPH_CLUSTER });
    }

    const hash = await allHash({
      clusters:      this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      settings:      this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING }),
      managedAddons: this.$store.dispatch('management/findAll', { type: MANAGEMENT.MANAGED_ADDON }),
      gpuDevices:    this.$store.dispatch('management/findAll', { type: LLMOS.GPUDEVICE }),
      viewContainer: this.$store.getters['prefs/get'](VIEW_CONTAINER_DASHBOARD),
    });

    this.clusters = hash.clusters;
    this.settings = hash.settings;
    this.managedAddons = hash.managedAddons;
    this.gpuDevices = hash.gpuDevices;
    this.viewContainerDashboard = hash.viewContainer;

    setPromiseResult(
      allDashboardsExist(this.$store, 'local', [CLUSTER_METRICS_DETAIL_URL, CLUSTER_METRICS_SUMMARY_URL]),
      this,
      'showClusterMetrics',
      'Determine cluster metrics'
    );

    setPromiseResult(
      allDashboardsExist(this.$store, 'local', [CLUSTER_GPU_METRICS_DETAIL_URL]),
      this,
      'showClusterGpuMetrics',
      'Determine cluster gpu metrics'
    );
  },

  data() {
    return {
      clusters:               [],
      settings:               [],
      managedAddons:          [],
      cephClusters:           [],
      gpuDevices:             [],
      clusterDetail:          null,
      clusterCounts:          {},
      viewContainerDashboard: false,
      CLUSTER_METRICS_SUMMARY_URL,
      CLUSTER_METRICS_DETAIL_URL,
      CLUSTER_GPU_METRICS_DETAIL_URL,
    };
  },

  computed: {
    ML_WORKLOAD_TYPES() {
      return ML_WORKLOAD_TYPES;
    },
    LLMOS() {
      return LLMOS;
    },
    MANAGEMENT() {
      return MANAGEMENT;
    },
    ...mapGetters(['currentCluster']),

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessNamespaces() {
      return !!this.clusterCounts?.[0]?.counts?.[NAMESPACE];
    },

    canAccessPVC() {
      return !!this.clusterCounts?.[0]?.counts?.[PVC];
    },

    canAccessMLCluster() {
      return !!this.clusterCounts?.[0]?.counts?.[ML_WORKLOAD_TYPES.RAY_CLUSTER];
    },

    canAccessModelServices() {
      return !!this.clusterCounts?.[0]?.counts?.[ML_WORKLOAD_TYPES.MODEL_SERVICE];
    },

    canAccessNotebooks() {
      return !!this.clusterCounts?.[0]?.counts?.[ML_WORKLOAD_TYPES.NOTEBOOK];
    },

    canAccessGPUDevices() {
      return !!this.clusterCounts?.[0]?.counts?.[LLMOS.GPUDEVICE];
    },

    isAdmin() {
      return isAdminUser(this.$store.getters);
    },

    hasDescription() {
      return !!this.currentCluster?.spec?.description;
    },

    llmIcon() {
      return require(`~shell/assets/images/providers/llm.svg`);
    },

    getServerVersion() {
      if (this.settings === []) {
        return 'unknown';
      }

      // loop setting and find the server-version
      for (let i = 0; i < this.settings.length; i++) {
        if (this.settings[i].id === 'server-version') {
          return this.settings[i].value || this.settings[i].default;
        }
      }

      return 'N/A';
    },

    getServerCreatedTime() {
      if (this.settings === []) {
        return 'unknown';
      }
      const serverVersion = this.settings.find((s) => s.id === 'server-version');

      if (serverVersion) {
        return serverVersion.metadata?.creationTimestamp;
      }

      return 'unknown';
    },

    cephStorageReady() {
      return this.cephClusters.find((c) => c.metadata.name === 'llmos-ceph' && c.status?.phase === 'Ready');
    },

    storageNotification() {
      const cephClusterAddon = this.managedAddons.find((m) => m.metadata.name === 'llmos-ceph-cluster');

      if (!cephClusterAddon || !cephClusterAddon.spec?.enabled) {
        return {
          type: 'warning',
          msg:  this.t('ceph.enableNotification', { url: getCephClusterAddonUrl() }, 'html'),
        };
      }

      const type = this.cephStorageReady ? 'info' : 'warning';

      return {
        type,
        msg: this.t('ceph.notification', {
          status: this.cephClusters[0]?.status?.phase,
          url:    getCephClusterAddonUrl()
        }, 'html'),
      };
    },
  },

  watch: {
    async clusters(neu) {
      this.clusterDetail = neu[0];
      await this.$store.dispatch('loadCluster', { id: this.clusterDetail.id });
      this.clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    }
  },
};
</script>

<template>
  <div v-if="clusterDetail">
    <header class="single-cluster-header">
      <img
        class="cluster-llm-logo"
        :src="llmIcon"
        alt="LLM ICON"
      >
      <h1>
        <t k="home.title" />
      </h1>
      <div>
        <span v-if="hasDescription">{{ currentCluster.spec.description }}</span>
      </div>
    </header>

    <Banner
      v-if="!cephStorageReady && isAdmin"
      :color="storageNotification.type"
      class="mb-20"
      :inner-html="storageNotification.msg"
    />

    <div class="home-overview-glance">
      <div
        v-if="clusterDetail.kubernetesVersionRaw"
      >
        <label>{{ t('home.glance.version') }}: </label>
        <span>{{ getServerVersion }}</span>
      </div>
      <div>
        <label>{{ t('home.glance.created') }}: </label>
        <span><LiveDate
          :value="getServerCreatedTime"
          :add-suffix="true"
          :show-tooltip="true"
        /></span>
      </div>
      <div :style="{'flex':1}" />
    </div>

    <div>
      <div class="single-cluster-info">
        <h3>
          Quick Access
        </h3>
        <div class="cluster-counts">
          <ResourceSummary
            v-if="canAccessMLCluster"
            :cluster="clusterDetail.id"
            :resource="ML_WORKLOAD_TYPES.RAY_CLUSTER"
            product="llmos"
          />
          <ResourceSummary
            v-if="canAccessNotebooks"
            :cluster="clusterDetail.id"
            :resource="ML_WORKLOAD_TYPES.NOTEBOOK"
            product="llmos"
          />
          <ResourceSummary
            v-if="canAccessModelServices"
            :cluster="clusterDetail.id"
            :resource="ML_WORKLOAD_TYPES.MODEL_SERVICE"
            product="llmos"
          />
        </div>
        <h3>Others</h3>
        <div class="cluster-counts">
          <ResourceSummary
            v-if="canAccessNodes"
            :cluster="clusterDetail.id"
            resource="node"
            product="llmos"
          />
          <ResourceSummary
            v-if="canAccessGPUDevices"
            :cluster="clusterDetail.id"
            :resource="LLMOS.GPUDEVICE"
            product="llmos"
          />
          <ResourceSummary
            v-if="canAccessPVC"
            :cluster="clusterDetail.id"
            resource="persistentvolumeclaim"
            product="llmos"
          />
        </div>
      </div>
    </div>

    <h3>Monitoring</h3>
    <Tabbed class="mt-30">
      <Tab
        name="cluster-metrics"
        :label="t('clusterIndexPage.sections.clusterMetrics.label')"
        :weight="99"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="CLUSTER_METRICS_DETAIL_URL"
            :summary-url="CLUSTER_METRICS_SUMMARY_URL"
            graph-height="825px"
          />
        </template>
      </Tab>

      <Tab
        name="cluster-gpu-metrics"
        :label="t('clusterIndexPage.sections.clusterGpuMetrics.label')"
        :weight="98"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="CLUSTER_GPU_METRICS_DETAIL_URL"
            :has-summary-and-detail="false"
            graph-height="825px"
          />
        </template>
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang="scss" scoped>
.single-cluster-header {
  align-items: center;
  display: flex;

  .provider-icon {
    margin-right: 10px;
  }

  h1 {
    font-size: 20px;
    margin: 0;
  }

  .cluster-llm-logo {
    margin-right: 10px;
    width: 30px;
    height: 30px;
  }
}
.single-cluster-info {
  margin-top: 20px;

  .cluster-counts {
    display: flex;
    flex-wrap: wrap;
    margin: 10px 0;
    > * {
      flex: 1 0 21%;
      margin: 5px;
      height: 100px;
      &:not(:last-child) {
        margin-right: 20px;
      }
    }
  }
}

.home-overview-glance {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 20px 0px;
  display: flex;

  &>*:not(:nth-last-child(-n+2)) {
    margin-right: 40px;
  }
}

.title h1 {
  margin: 0;
}
</style>
