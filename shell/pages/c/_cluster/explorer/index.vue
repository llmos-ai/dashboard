<script>
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import {
  ENDPOINTS,
  EVENT,
  NAMESPACE,
  INGRESS,
  MANAGEMENT,
  METRIC,
  NODE,
  SERVICE,
  PV,
  WORKLOAD_TYPES,
  COUNT,
  SECRET
} from '@shell/config/types';
import AlertTable from '@shell/components/AlertTable';
import { Banner } from '@components/Banner';
import { parseSi, createMemoryValues } from '@shell/utils/units';
import {
  NAME,
  ROLES,
  STATE,
} from '@shell/config/table-headers';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import EtcdInfoBanner from '@shell/components/EtcdInfoBanner';
import metricPoller from '@shell/mixins/metric-poller';
import ResourceSummary, { resourceCounts } from '@shell/components/ResourceSummary';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge';
import { isEmpty } from '@shell/utils/object';
import EventsTable from './EventsTable';
import { fetchClusterResources } from './explorer-utils';
import SimpleBox from '@shell/components/SimpleBox';
import { ExtensionPoint, CardLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import Certificates from '@shell/components/Certificates';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export const RESOURCES = [NAMESPACE, INGRESS, PV, WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.DAEMON_SET, SERVICE];

const COMPONENT_STATUS = [
  'etcd',
  'scheduler',
  'controller-manager',
];

export default {
  name: 'ClusterExplorerIndexPage',

  components: {
    EtcdInfoBanner,
    DashboardMetrics,
    HardwareResourceGauge,
    ResourceSummary,
    Tab,
    Tabbed,
    AlertTable,
    Banner,
    EventsTable,
    SimpleBox,
    Certificates
  },

  mixins: [metricPoller],

  fetch() {
    fetchClusterResources(this.$store, NODE);
  },

  data() {
    const clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    const nodeHeaders = [
      STATE,
      NAME,
      ROLES,
    ];

    return {
      nodeHeaders,
      constraints:        [],
      events:             [],
      nodeMetrics:        [],
      showClusterMetrics: false,
      showK8sMetrics:     false,
      showEtcdMetrics:    false,
      canViewMetrics:     false,
      clusterCounts,
      selectedTab:        'cluster-events',
      extensionCards:     getApplicableExtensionEnhancements(this, ExtensionPoint.CARD, CardLocation.CLUSTER_DASHBOARD_CARD, this.$route),
    };
  },

  beforeUnmount() {
    // Remove the data and stop watching resources that were fetched in this page
    // Events in particular can lead to change messages having to be processed when we are no longer interested in events
    this.$store.dispatch('cluster/forgetType', EVENT);
    this.$store.dispatch('cluster/forgetType', NODE);
    this.$store.dispatch('cluster/forgetType', ENDPOINTS); // Used by AlertTable to get alerts when v2 monitoring is installed
    this.$store.dispatch('cluster/forgetType', METRIC.NODE);
  },

  computed: {
    ...mapGetters(['currentCluster']),

    nodes() {
      return this.$store.getters['cluster/all'](NODE);
    },

    mgmtNodes() {
      return this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
    },

    displayProvider() {
      const other = 'other';

      let provider = this.currentCluster?.status?.provider || other;

      if (provider === 'rke.windows') {
        provider = 'rkeWindows';
      }

      if (!this.$store.getters['i18n/exists'](`cluster.provider.${ provider }`)) {
        provider = 'other';
      }

      return this.t(`cluster.provider.${ provider }`);
    },

    isRKE() {
      return ['rke', 'rke.windows', 'rke2', 'rke2.windows'].includes((this.currentCluster.status.provider || '').toLowerCase());
    },

    accessibleResources() {
      // This is a list of IDs for allowed resources counts.
      const defaultAllowedResources = Object.keys(this.clusterCounts?.[0]?.counts || {}).filter((typeId) => {
        return this.$store.getters['type-map/isIgnored']({ id: typeId });
      });

      // Merge with RESOURCES list
      const allowedResources = [...new Set([...defaultAllowedResources, ...RESOURCES])];

      return allowedResources.filter((resource) => this.$store.getters['cluster/schemaFor'](resource));
    },

    componentServices() {
      const status = [];

      COMPONENT_STATUS.forEach((cs) => {
        status.push({
          name:     cs,
          healthy:  this.isComponentStatusHealthy(cs),
          labelKey: `clusterIndexPage.sections.componentStatus.${ cs }`,
        });
      });

      return status;
    },

    totalCountGaugeInput() {
      const totalInput = {
        name:         this.t('clusterIndexPage.resourceGauge.totalResources'),
        total:        0,
        useful:       0,
        warningCount: 0,
        errorCount:   0
      };

      this.accessibleResources.forEach((resource) => {
        const counts = resourceCounts(this.$store, resource);

        Object.entries(counts).forEach((entry) => {
          totalInput[entry[0]] += entry[1];
        });
      });

      return totalInput;
    },

    hasStats() {
      return this.currentCluster?.status?.allocatable && this.currentCluster?.status?.requested;
    },

    cpuReserved() {
      const total = parseSi(this.currentCluster?.status?.allocatable?.cpu);

      return {
        total,
        useful: parseSi(this.currentCluster?.status?.requested?.cpu),
        units:  this.t('clusterIndexPage.hardwareResourceGauge.units.cores', { count: total })
      };
    },

    podsUsed() {
      return {
        total:  parseSi(this.currentCluster?.status?.allocatable?.pods || '0'),
        useful: parseSi(this.currentCluster?.status?.requested?.pods || '0'),
      };
    },

    ramReserved() {
      return createMemoryValues(this.currentCluster?.status?.allocatable?.memory, this.currentCluster?.status?.requested?.memory);
    },

    metricAggregations() {
      let checkNodes = this.nodes;

      // Special case local cluster
      if (this.currentCluster.isLocal) {
        const nodeNames = this.nodes.reduce((acc, n) => {
          acc[n.id] = n;

          return acc;
        }, {});

        checkNodes = this.mgmtNodes.filter((n) => {
          const nodeName = n.metadata?.labels?.['management.cattle.io/nodename'] || n.id;

          return !!nodeNames[nodeName];
        });
      }

      const someNonWorkerRoles = checkNodes.some((node) => node.hasARole && !node.isWorker);
      const metrics = this.nodeMetrics.filter((nodeMetrics) => {
        const node = this.nodes.find((nd) => nd.id === nodeMetrics.id);

        return node && (!someNonWorkerRoles || node.isWorker);
      });
      const initialAggregation = {
        cpu:    0,
        memory: 0
      };

      if (isEmpty(metrics)) {
        return null;
      }

      return metrics.reduce((agg, metric) => {
        agg.cpu += parseSi(metric.usage.cpu);
        agg.memory += parseSi(metric.usage.memory);

        return agg;
      }, initialAggregation);
    },

    cpuUsed() {
      const total = parseSi(this.currentCluster?.status?.capacity?.cpu);

      return {
        total,
        useful: this.metricAggregations?.cpu,
        units:  this.t('clusterIndexPage.hardwareResourceGauge.units.cores', { count: total })
      };
    },

    ramUsed() {
      return createMemoryValues(this.currentCluster?.status?.capacity?.memory, this.metricAggregations?.memory);
    },

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessDeployments() {
      return !!this.clusterCounts?.[0]?.counts?.[WORKLOAD_TYPES.DEPLOYMENT];
    },

    hasMetricsTabs() {
      return this.canViewMetrics && ( this.showClusterMetrics || this.showK8sMetrics || this.showEtcdMetrics);
    },

    hasBadge() {
      return !!this.currentCluster?.badge;
    },

    hasDescription() {
      return !!this.currentCluster?.spec?.description;
    },

    allEventsLink() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  EXPLORER,
          resource: EVENT,
        }
      };
    },

    allSecretsLink() {
      return {
        name:   'c-cluster-product-resource',
        params: {
          product:  EXPLORER,
          resource: SECRET,
        }
      };
    }
  },

  methods: {
    // Ported from Ember
    isComponentStatusHealthy(field) {
      const matching = (this.currentCluster?.status?.componentStatuses || []).filter((s) => s.name.startsWith(field));

      // If there's no matching component status, it's "healthy"
      if ( !matching.length ) {
        return true;
      }

      const count = matching.reduce((acc, status) => {
        const conditions = status.conditions.find((c) => c.status !== 'True');

        return !conditions ? acc : acc + 1;
      }, 0);

      return count === 0;
    },

    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.currentCluster,
        elem:      this.$refs['cluster-actions'],
      });
    },

    // Used by metric-poller mixin
    async loadMetrics() {
      this.nodeMetrics = await fetchClusterResources(this.$store, METRIC.NODE, { force: true } );
    },

    // Events/Alerts tab changed
    tabChange(neu) {
      this.selectedTab = neu?.selectedName;
    },
  },
};
</script>

<template>
  <section class="dashboard">
    <header>
      <div class="title">
        <h1>
          <t k="clusterIndexPage.header" />
        </h1>
        <div>
          <span v-if="hasDescription">{{ currentCluster.spec.description }}</span>
        </div>
      </div>
    </header>

    <div
      class="cluster-dashboard-glance"
    >
      <div>
        <label>{{ t('glance.provider') }}: </label>
        <span>
          {{ displayProvider }}
        </span>
      </div>
      <div>
        <label>{{ t('glance.version') }}: </label>
        <span>{{ currentCluster.kubernetesVersionBase }}</span>
        <span
          v-if="currentCluster.kubernetesVersionExtension"
          style="font-size: 0.75em"
        >{{ currentCluster.kubernetesVersionExtension }}</span>
      </div>
      <div>
        <label>{{ t('glance.created') }}: </label>
        <span><LiveDate
          :value="currentCluster.metadata.creationTimestamp"
          :add-suffix="true"
          :show-tooltip="true"
        /></span>
      </div>
      <div :style="{'flex':1}" />
    </div>

    <div class="resource-gauges">
      <ResourceSummary :spoofed-counts="totalCountGaugeInput" />
      <ResourceSummary
        v-if="canAccessNodes"
        resource="node"
      />
      <ResourceSummary
        v-if="canAccessDeployments"
        resource="apps.deployment"
      />
    </div>

    <!-- extension cards -->
    <div
      v-if="extensionCards.length"
      class="extension-card-container mt-20"
    >
      <SimpleBox
        v-for="item, i in extensionCards"
        :key="`extensionCards${i}`"
        class="extension-card"
        :style="item.style"
      >
        <h3>
          {{ item.label }}
        </h3>
        <component
          :is="item.component"
          :resource="currentCluster"
        />
      </SimpleBox>
    </div>

    <h3
      v-if="hasStats"
      class="mt-40"
    >
      {{ t('clusterIndexPage.sections.capacity.label') }}
    </h3>
    <div
      v-if="hasStats"
      class="hardware-resource-gauges"
    >
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.pods')"
        :used="podsUsed"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.cores')"
        :reserved="cpuReserved"
        :used="cpuUsed"
        :units="cpuReserved.units"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.ram')"
        :reserved="ramReserved"
        :used="ramUsed"
        :units="ramReserved.units"
      />
    </div>

    <div v-if="componentServices">
      <div
        v-for="(status, i) in componentServices"
        :key="i"
        class="k8s-component-status"
        :class="{'k8s-component-status-healthy': status.healthy, 'k8s-component-status-unhealthy': !status.healthy}"
      >
        <i
          v-if="status.healthy"
          class="icon icon-checkmark"
        />
        <i
          v-else
          class="icon icon-warning"
        />
        <div>{{ t(status.labelKey) }}</div>
      </div>
    </div>

    <div class="mt-30">
      <Tabbed @changed="tabChange">
        <Tab
          name="cluster-events"
          :label="t('clusterIndexPage.sections.events.label')"
          :weight="2"
        >
          <span class="events-table-link">
            <router-link :to="allEventsLink">
              <span>{{ t('glance.eventsTable') }}</span>
            </router-link>
          </span>
          <EventsTable />
        </Tab>
        <Tab
          name="cluster-certs"
          :label="t('clusterIndexPage.sections.certs.label')"
          :weight="1"
        >
          <span class="events-table-link">
            <router-link :to="allSecretsLink">
              <span>{{ t('glance.secretsTable') }}</span>
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
  grid-template-columns: repeat(auto-fit, minmax(calc((100%/3) - 40px), 1fr));
  grid-column-gap: 15px;
  grid-row-gap: 20px;
}

@media only screen and (max-width: map-get($breakpoints, "--viewport-9")) {
  .extension-card-container {
    grid-template-columns: 1fr !important;
  }
}

.cluster-dashboard-glance {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 20px 0px;
  display: flex;

  &>*:not(:nth-last-child(-n+2)) {
    margin-right: 40px;

    & SPAN {
       font-weight: bold
    }
  }
}

.title h1 {
  margin: 0;
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

.monitoring-install {
  display: flex;
  margin-left: 10px;

  > I {
    line-height: inherit;
    margin-right: 4px;
  }

  &:focus {
    outline: 0;
  }
}

.events-table-link {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.k8s-component-status {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  margin-top: 20px;

  &:not(:last-child) {
    margin-right: 20px;
  }

  > div {
    padding: 5px 20px;
  }

  > I {
    text-align: center;
    padding: 5px 10px;
    border-right: 1px solid var(--border);
  }

  &.k8s-component-status-unhealthy {
    border-color: var(--error-border);

    > I {
      color: var(--error)
    }
  }

  &.k8s-component-status-healthy {
    border-color: var(--border);

    > I {
      color: var(--success)
    }
  }
}
</style>
