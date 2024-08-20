<script>
import ResourceSummary from '@shell/components/ResourceSummary';
import {
  NAMESPACE, MANAGEMENT, NODE, COUNT, LLMOS
} from '@shell/config/types';
import { RESOURCES } from '@shell/pages/c/_cluster/explorer/index';
import { VIEW_CONTAINER_DASHBOARD } from '@shell/store/prefs';
import { mapGetters } from 'vuex';

const COMPONENT_STATUS = [
  'etcd',
  'scheduler',
  'controller-manager',
  'storage',
];

export default {
  components: { ResourceSummary },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
    this.viewContainerDashboard = this.$store.getters['prefs/get'](VIEW_CONTAINER_DASHBOARD);

    if (this.$store.getters['management/schemaFor'](LLMOS.CEPH_CLUSTER)) {
      this.cephCluster = await this.$store.dispatch('management/find',
        { type: LLMOS.CEPH_CLUSTER, id: 'ceph-system/llmos-ceph' });
    }

    if (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)) {
      this.settings = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  { url: MANAGEMENT.SETTING }
      });
    }
  },

  data() {
    return {
      clusters:               [],
      cephCluster:            {},
      clusterDetail:          null,
      clusterCounts:          {},
      viewContainerDashboard: false,
      settings:               [],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    exploreLink() {
      return { name: 'c-cluster', params: { cluster: this.clusterDetail.id } };
    },

    accessibleResources() {
      return RESOURCES.filter((resource) => this.$store.getters['cluster/schemaFor'](resource));
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

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessNamespaces() {
      return !!this.clusterCounts?.[0]?.counts?.[NAMESPACE];
    },

    canAccessMLCluster() {
      return !!this.clusterCounts?.[0]?.counts?.[LLMOS.RAY_CLUSTER];
    },

    canAccessModelServices() {
      return !!this.clusterCounts?.[0]?.counts?.[LLMOS.MODEL_SERVICE];
    },

    canAccessNotebooks() {
      return !!this.clusterCounts?.[0]?.counts?.[LLMOS.NOTEBOOK];
    },

    hasDescription() {
      return !!this.currentCluster?.spec?.description;
    },

    llmIcon() {
      return require(`~shell/assets/images/providers/llm.svg`);
    },

    getServerVersion() {
      if ( this.settings === [] ) {
        return 'unknown';
      }

      // loop setting and find the server-version
      for ( let i = 0; i < this.settings.length; i++ ) {
        if ( this.settings[i].id === 'server-version' ) {
          return this.settings[i].value;
        }
      }

      return 'N/A';
    },

  },

  watch: {
    async clusters(neu) {
      this.clusterDetail = neu[0];
      await this.$store.dispatch('loadCluster', { id: this.clusterDetail.id });
      this.clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    }
  },

  methods: {
    isComponentStatusHealthy(field) {
      if (field === 'storage') {
        return this.cephCluster?.status?.phase === 'Ready';
      }

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
  }
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
          :value="clusterDetail.metadata.creationTimestamp"
          :add-suffix="true"
          :show-tooltip="true"
        /></span>
      </div>
      <div :style="{'flex':1}" />
    </div>

    <div>
      <div class="single-cluster-info">
        <div class="cluster-counts">
          <ResourceSummary
            v-if="canAccessNodes"
            :cluster="clusterDetail.id"
            resource="node"
            product="llm"
          />
          <ResourceSummary
            v-if="canAccessNamespaces"
            :cluster="clusterDetail.id"
            resource="namespace"
            product="llm"
          />
          <ResourceSummary
            :cluster="clusterDetail.id"
            resource="persistentvolumeclaim"
            product="llm"
          />
        </div>
        <div class="cluster-counts">
          <ResourceSummary
            v-if="canAccessMLCluster"
            :cluster="clusterDetail.id"
            resource="ray.io.raycluster"
            product="llm"
          />
          <ResourceSummary
            v-if="canAccessModelServices"
            :cluster="clusterDetail.id"
            resource="ml.llmos.ai.modelservice"
            product="llm"
          />
          <ResourceSummary
            v-if="canAccessNotebooks"
            :cluster="clusterDetail.id"
            resource="ml.llmos.ai.notebook"
            product="llm"
          />
        </div>
      </div>
    </div>

    <div v-if="componentServices">
      <div
        v-for="status in componentServices"
        :key="status.name"
        class="home-component-status"
        :class="{'home-component-status-healthy': status.healthy, 'home-component-status-unhealthy': !status.healthy}"
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

  .section {
    margin: 15px 0 5px 0;
    font-weight: bold;
  }

  .cluster-counts {
    display: flex;
    flex-wrap: wrap;
    margin: 10px 0;
    > * {
      flex: 1 0 21%;
      margin: 5px;
      height: 100px;
      //&:not(:last-child) {
      //  margin-right: 20px;
      //}
    }
  }

  .glance-item {
    font-size: 14px;
    padding: 5px 0;

    .cluster-link {
      font-size: 14px;
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

    & SPAN {
      font-weight: bold
    }
  }
}

.title h1 {
  margin: 0;
}

.home-component-status {
  align-items: center;
  display: inline-flex;
  border: 1px solid;
  border-radius: 3px;
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

  &.home-component-status-unhealthy {
    border-color: var(--error-border);

    > I {
      color: var(--error)
    }
  }

  &.home-component-status-healthy {
    border-color: var(--border);

    > I {
      color: var(--success)
    }
  }
}
</style>
