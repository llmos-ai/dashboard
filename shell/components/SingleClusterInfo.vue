<script>
import ResourceSummary from '@shell/components/ResourceSummary';
import {
  NAMESPACE,
  MANAGEMENT,
  NODE,
  COUNT,
  LLMOS,
  PVC,
  ML_WORKLOAD_TYPES,
  CEPH,
  EVENT,
  SECRET,
} from '@shell/config/types';
import { VIEW_CONTAINER_DASHBOARD } from '@shell/store/prefs';
import { allHash, setPromiseResult } from '@shell/utils/promise';
import { Banner } from '@components/Banner';
import { getCephClusterAddonUrl } from '@shell/utils/url';
import { isAdminUser } from '@shell/store/type-map';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import { allDashboardsExist } from '@shell/utils/grafana';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import { canViewGrafanaLink } from '@shell/utils/monitoring';
import { NODE_ARCHITECTURE } from '@shell/config/labels-annotations';
import capitalize from 'lodash/capitalize';
import TabTitle from '@shell/components/TabTitle.vue';
import Certificates from '@shell/components/Certificates.vue';
import EventsTable from '@shell/pages/c/_cluster/llmos/EventsTable.vue';
import { NAME as LLMOS_PRODUCT } from '@shell/config/product/llmos';
import AlertTable from '@shell/components/AlertTable';

const CLUSTER_METRICS_DETAIL_URL =
  '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-cluster-nodes-1/llmos-cluster-nodes?orgId=1';
const CLUSTER_METRICS_SUMMARY_URL =
  '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-cluster-1/llmos-cluster?orgId=1';
const CLUSTER_GPU_METRICS_DETAIL_URL =
  '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/d/llmos-gpu-cluster-nodes-1/llmos-gpu-cluster-nodes?orgId=1';

export default {
  name:  'SingleClusterHomeOverview',
  props: {
    clusterId: {
      type:    String,
      default: 'local',
    },
  },
  components: {
    ResourceSummary,
    DashboardMetrics,
    Tab,
    Tabbed,
    Banner,
    TabTitle,
    EventsTable,
    AlertTable,
    Certificates,
  },

  async fetch() {
    if (this.currentCluster) {
      // Load the current cluster first
      await this.$store.dispatch('loadCluster', { id: this.currentCluster.id });

      const hash = await allHash({
        settings:      this.$store.dispatch('cluster/findAll', { type: MANAGEMENT.SETTING }),
        managedAddons: this.$store.dispatch('cluster/findAll', { type: MANAGEMENT.MANAGED_ADDON }),
      });

      this.settings = hash.settings;
      this.managedAddons = hash.managedAddons;

      setPromiseResult(
        allDashboardsExist(this.$store, this.currentCluster.id, [
          CLUSTER_METRICS_DETAIL_URL,
          CLUSTER_METRICS_SUMMARY_URL,
        ]),
        this,
        'showClusterMetrics',
        'Determine cluster metrics'
      );

      setPromiseResult(
        allDashboardsExist(this.$store, this.currentCluster.id, [
          CLUSTER_GPU_METRICS_DETAIL_URL,
        ]),
        this,
        'showClusterGPUMetrics',
        'Determine cluster gpu metrics'
      );

      setPromiseResult(
        canViewGrafanaLink(this.$store, 'management'),
        this,
        'canViewMetrics',
        'Determine can view metrics'
      );
    }

    this.canViewCeph = this.$store.getters[`cluster/schemaFor`](
      CEPH.CEPH_CLUSTER
    );
    this.canViewGpuDevices = this.$store.getters[`cluster/schemaFor`](
      LLMOS.GPUDEVICE
    );
    this.canViewNodes = this.$store.getters[`cluster/schemaFor`](NODE);

    if (this.canViewCeph) {
      this.cephClusters = await this.$store.dispatch('cluster/findAll', { type: CEPH.CEPH_CLUSTER });
    }

    if (this.canViewGpuDevices) {
      this.gpuDevices = await this.$store.dispatch('cluster/findAll', { type: LLMOS.GPUDEVICE });
    }

    if (this.canViewNodes) {
      this.nodes = await this.$store.dispatch('cluster/findAll', { type: NODE });
    }
  },

  data() {
    const currentCluster = this.$store.getters['management/byId'](
      MANAGEMENT.CLUSTER,
      this.clusterId
    );

    return {
      currentCluster,
      nodes:                 [],
      settings:              [],
      managedAddons:         [],
      cephClusters:          [],
      gpuDevices:            [],
      canViewMetrics:        false,
      showClusterMetrics:    false,
      showClusterGPUMetrics: false,
      canViewGpuDevices:     false,
      canViewCeph:           false,
      selectedTab:           '',
      LLMOS,
      ML_WORKLOAD_TYPES,
      CLUSTER_METRICS_SUMMARY_URL,
      CLUSTER_METRICS_DETAIL_URL,
      CLUSTER_GPU_METRICS_DETAIL_URL,
    };
  },

  beforeUnmount() {
    // Remove the data and stop watching resources that were fetched in this page
    // Events in particular can lead to change messages having to be processed when we are no longer interested in events
    this.$store.dispatch('cluster/forgetType', EVENT);
    clearInterval(this.interval);
  },

  computed: {
    clusterCounts() {
      return this.$store.getters['cluster/all'](COUNT);
    },

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessNamespaces() {
      return !!this.clusterCounts?.[0]?.counts?.[NAMESPACE];
    },

    viewContainerDashboard() {
      return this.$store.getters['prefs/get'](VIEW_CONTAINER_DASHBOARD);
    },

    nodesArchitecture() {
      const obj = {};

      this.nodes?.forEach((node) => {
        if (!node.metadata?.state?.transitioning) {
          const architecture = node.labels?.[NODE_ARCHITECTURE];

          const key = architecture ? capitalize(architecture) : this.t('cluster.architecture.label.unknown');

          obj[key] = (obj[key] || 0) + 1;
        }
      });

      return obj;
    },

    architecture() {
      const keys = Object.keys(this.nodesArchitecture);

      switch (keys.length) {
      case 0:
        return { label: this.t('generic.provisioning') };
      case 1:
        return { label: keys[0] };
      default:
        return {
          label:   this.t('cluster.architecture.label.mixed'),
          tooltip: keys.reduce(
            (acc, k) => `${ acc }${ k }: ${ this.nodesArchitecture[k] }<br>`,
            ''
          ),
        };
      }
    },

    canAccessPVC() {
      return !!this.clusterCounts?.[0]?.counts?.[PVC];
    },

    canAccessMLCluster() {
      return !!this.clusterCounts?.[0]?.counts?.[ML_WORKLOAD_TYPES.RAY_CLUSTER];
    },

    canAccessModelServices() {
      return !!this.clusterCounts?.[0]?.counts?.[
        ML_WORKLOAD_TYPES.MODEL_SERVICE
      ];
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
      return !!this.cluster?.spec?.description;
    },

    hasMonitoring() {
      return (
        this.canViewMetrics &&
        (this.showClusterMetrics || this.showClusterGPUMetrics)
      );
    },

    showClusterTools() {
      return isAdminUser(this.$store.getters);
    },

    dashboardIcon() {
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
      const serverVersion = this.settings.find(
        (s) => s.id === 'server-version'
      );

      if (serverVersion) {
        return serverVersion.metadata?.creationTimestamp;
      }

      return 'unknown';
    },

    cephStorageReady() {
      if (!this.canViewCeph) {
        return false;
      }
      const ready = this.cephClusters.find(
        (c) => c.metadata.name === 'llmos-ceph' && c.status?.phase === 'Ready'
      );

      return ready;
    },

    storageNotification() {
      // TODO: refactor
      const cephClusterAddon = this.managedAddons.find(
        (m) => m.metadata.name === 'llmos-ceph-cluster'
      );

      if (!cephClusterAddon || !cephClusterAddon.spec?.enabled) {
        const message = {
          type: 'warning',
          msg:  this.t(
            'ceph.enableNotification',
            { url: getCephClusterAddonUrl() },
            true
          ),
        };

        return message;
      }

      const type = this.cephStorageReady ? 'success' : 'warning';

      return {
        type,
        msg: this.t(
          'ceph.notification',
          {
            status: this.cephClusters[0]?.status?.phase,
            url:    getCephClusterAddonUrl(),
          },
          true
        ),
      };
    },

    allEventsLink() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  LLMOS_PRODUCT,
          resource: EVENT,
          cluster:  this.currentCluster.id,
        },
      };
    },

    allSecretsLink() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  LLMOS_PRODUCT,
          resource: SECRET,
          cluster:  this.currentCluster.id,
        },
      };
    },

    clusterToolsLink() {
      return {
        name:   'c-cluster-llmos-tools',
        params: { cluster: this.currentCluster.id },
      };
    },
  },

  methods: {
    // Events/Alerts tab changed
    tabChange(neu) {
      this.selectedTab = neu?.selectedName;
    },
  },
};
</script>

<template>
  <section
    v-if="currentCluster"
    class="dashboard"
  >
    <header>
      <div class="title">
        <h1>
          <img
            class="cluster-dashboard-logo"
            :src="dashboardIcon"
            alt="Dashboard Icon"
          >
          <TabTitle>
            {{ t("home.title") }}
          </TabTitle>
        </h1>
        <div
          v-if="hasDescription"
          class="cluster-dashboard-description"
        >
          <span>{{ currentCluster.spec.description }}</span>
        </div>
      </div>
    </header>

    <div class="home-dashboard-glance mb-20">
      <div>
        <label>{{ t("home.glance.version") }}: </label>
        <span>{{ getServerVersion }}</span>
      </div>
      <div v-if="nodes.length > 0">
        <label>{{ t("home.glance.architecture") }}: </label>
        <span v-clean-tooltip="architecture.tooltip">
          {{ architecture.label }}
        </span>
      </div>
      <div>
        <label>{{ t("home.glance.created") }}: </label>
        <span><LiveDate
          :value="getServerCreatedTime"
          :add-suffix="true"
          :show-tooltip="true"
        /></span>
      </div>
      <div :style="{ flex: 1 }" />
      <div v-if="showClusterTools">
        <router-link
          :to="clusterToolsLink"
          class="cluster-tools-link"
        >
          <span>{{ t("nav.clusterTools") }}</span>
        </router-link>
      </div>
    </div>

    <div
      v-if="canViewCeph && !cephStorageReady"
      class="mb-20"
    >
      <Banner :color="storageNotification.type">
        <span v-html="storageNotification.msg" />
      </Banner>
    </div>

    <div class="home-dashboard-info">
      <h4>Quick Access</h4>
      <div class="resource-gauges mb-20">
        <ResourceSummary
          v-if="canAccessMLCluster"
          :cluster="currentCluster.id"
          :resource="ML_WORKLOAD_TYPES.RAY_CLUSTER"
        />
        <ResourceSummary
          v-if="canAccessNotebooks"
          :cluster="currentCluster.id"
          :resource="ML_WORKLOAD_TYPES.NOTEBOOK"
        />
        <ResourceSummary
          v-if="canAccessModelServices"
          :cluster="currentCluster.id"
          :resource="ML_WORKLOAD_TYPES.MODEL_SERVICE"
        />
      </div>

      <h3>Others</h3>
      <div class="resource-gauges mb-20">
        <ResourceSummary
          v-if="canAccessNodes"
          :cluster="currentCluster.id"
          resource="node"
        />
        <ResourceSummary
          v-if="canAccessGPUDevices"
          :cluster="currentCluster.id"
          :resource="LLMOS.GPUDEVICE"
        />
        <ResourceSummary
          v-if="canAccessNamespaces"
          :cluster="currentCluster.id"
          resource="namespace"
        />
        <ResourceSummary
          v-if="canAccessPVC"
          :cluster="currentCluster.id"
          resource="persistentvolumeclaim"
        />
      </div>
    </div>

    <div class="mt-30 mb-20">
      <Tabbed @changed="tabChange">
        <Tab
          v-if="hasMonitoring"
          name="cluster-metrics"
          :label="t('clusterIndexPage.sections.clusterMetrics.label')"
          :weight="4"
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
          v-if="hasMonitoring"
          name="cluster-gpu-metrics"
          :label="t('clusterIndexPage.sections.clusterGpuMetrics.label')"
          :weight="3"
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
        <Tab
          name="cluster-events"
          :label="t('clusterIndexPage.sections.events.label')"
          :weight="2"
        >
          <template #default="props">
            <span class="events-table-link">
              <router-link :to="allEventsLink">
                <span>{{ t("glance.eventsTable") }}</span>
              </router-link>
            </span>
            <EventsTable v-if="props.active" />
          </template>
        </Tab>
        <Tab
          v-if="hasMonitoring"
          name="cluster-alerts"
          :label="t('clusterIndexPage.sections.alerts.label')"
          :weight="1"
        >
          <AlertTable v-if="selectedTab === 'cluster-alerts'" />
        </Tab>
        <Tab
          name="cluster-certs"
          :label="t('clusterIndexPage.sections.certs.label')"
          :weight="1"
        >
          <span class="cert-table-link">
            <router-link :to="allSecretsLink">
              <span>{{ t("glance.secretsTable") }}</span>
            </router-link>
          </span>
          <Certificates v-if="selectedTab === 'cluster-certs'" />
        </Tab>
      </Tabbed>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.extension-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc((100% / 3) - 40px), 1fr));
  grid-column-gap: 15px;
  grid-row-gap: 20px;
}

@media only screen and (max-width: map-get($breakpoints, "--viewport-9")) {
  .extension-card-container {
    grid-template-columns: 1fr !important;
  }
}

.home-dashboard-glance {
  align-items: center;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 15px 0px;
  display: flex;

  & > *:not(:nth-last-child(-n + 2)) {
    margin-right: 40px;
  }
}

.title {
  h1 {
    margin: 0;
    font-size: 20px;
  }

  .cluster-dashboard-description {
    margin: 5px 0;
    opacity: 0.7;
  }

  .cluster-dashboard-logo {
    margin-right: 0.6rem;
    width: 25px;
    height: 25px;
    float: left;
  }
}

.home-dashboard-info {
  .resource-gauges {
    margin-top: 10px;
  }
}

.actions-span {
  align-self: center;
}

.events {
  margin-top: 30px;
}

.graph-options {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.etcd-metrics :deep() .external-link {
  top: -107px;
}

.cluster-tools-tip {
  margin-top: 0;
}

.cluster-tools-link {
  display: flex;
  margin-right: 10px;

  > I {
    line-height: inherit;
    margin-right: 4px;
  }

  &:focus {
    outline: 0;
  }
}

.events-table-link,
.cert-table-link {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.k8s-service-status {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  border-color: var(--border);
  margin-top: 20px;

  .label {
    border-left: 1px solid var(--border);
  }

  &:not(:last-child) {
    margin-right: 20px;
  }

  > div {
    padding: 5px 20px;
  }

  > I {
    text-align: center;
    padding: 5px 10px;
  }

  &.unhealthy {
    border-color: var(--error-border);

    > I {
      color: var(--error);
    }
  }

  &.warning {
    > I {
      color: var(--warning);
    }
  }

  &.healthy {
    > I {
      color: var(--success);
    }
  }
}
</style>
