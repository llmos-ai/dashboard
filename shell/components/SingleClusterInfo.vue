<script>
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ResourceSummary, { resourceCounts } from '@shell/components/ResourceSummary';
import { NAMESPACE, MANAGEMENT, NODE, COUNT, CLUSTER } from '@shell/config/types';
import { RESOURCES } from '@shell/pages/c/_cluster/explorer/index';
import { VIEW_CONTAINER_DASHBOARD } from "@shell/store/prefs";

export default {
  components: {
    ClusterProviderIcon,
    ResourceSummary
  },

  async fetch() {
    this.clusters = await this.$store.dispatch('management/findAll', {
      type: MANAGEMENT.CLUSTER,
      opt:  { url: MANAGEMENT.CLUSTER }
    });
    this.viewContainerDashboard = this.$store.getters['prefs/get'](VIEW_CONTAINER_DASHBOARD);
  },

  data() {
    return {
      clusters:      [],
      clusterDetail: null,
      clusterCounts: {},
      viewContainerDashboard: false,
    };
  },

  computed: {
    exploreLink() {
      return { name: 'c-cluster', params: { cluster: this.clusterDetail.id } };
    },

    accessibleResources() {
      return RESOURCES.filter((resource) => this.$store.getters['cluster/schemaFor'](resource));
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

    canAccessNodes() {
      return !!this.clusterCounts?.[0]?.counts?.[NODE];
    },

    canAccessNamespaces() {
      return !!this.clusterCounts?.[0]?.counts?.[NAMESPACE];
    },

    canAccessModelFiles() {
      return !!this.clusterCounts?.[0]?.counts?.[CLUSTER.MODEL_FILE];
    },

    canAccessChats() {
      return !!this.clusterCounts?.[0]?.counts?.[CLUSTER.CHAT];
    },

    llmIcon() {
      return  require(`~shell/assets/images/providers/llm.svg`);
    }
  },

  watch: {
    async clusters(neu) {
      this.clusterDetail = neu[0];
      await this.$store.dispatch('loadCluster', { id: this.clusterDetail.id });
      this.clusterCounts = this.$store.getters[`cluster/all`](COUNT);
    }
  }
};
</script>

<template>
  <div v-if="clusterDetail">
    <!-- LLM info -->
    <div>
      <div class="single-cluster-header">
        <img
            class="cluster-llm-logo"
            :src="llmIcon"
            alt="LLM ICON"
        >
        <h1>{{ t('glance.clusterLLMInfo') }}</h1>
      </div>

      <div class="single-cluster-info">
        <div class="cluster-counts">
          <ResourceSummary
              v-if="canAccessModelFiles"
              :cluster="clusterDetail.id"
              resource="ray.io.raycluster"
              product="llm"
          />
          <ResourceSummary
              v-if="canAccessModelFiles"
              :cluster="clusterDetail.id"
              resource="ml.llmos.ai.modelfile"
              product="llm"
          />
          <ResourceSummary
              v-if="canAccessModelFiles"
              :cluster="clusterDetail.id"
              resource="ml.llmos.ai.notebook"
              product="llm"
          />
        </div>
      </div>
    </div>

    <!-- container cluster info -->
    <div v-if="viewContainerDashboard">
      <div class="single-cluster-header">
        <ClusterProviderIcon
            :cluster="clusterDetail"
            class="provider-icon"
            width="32"
        />
        <h1>{{ t('glance.clusterInfo') }}</h1>
      </div>

      <div class="single-cluster-info">
        <div class="cluster-counts">
          <ResourceSummary :spoofed-counts="totalCountGaugeInput" />
          <ResourceSummary
              v-if="canAccessNodes"
              :cluster="clusterDetail.id"
              resource="node"
          />
          <ResourceSummary
              v-if="canAccessNamespaces"
              :cluster="clusterDetail.id"
              resource="namespace"
          />
        </div>
      </div>
    </div>

    <div class="single-cluster-info">
      <div class="glance-item">
        <label>{{ t('glance.provider') }}: </label>
        <span>{{ t(`cluster.provider.${ clusterDetail.status.provider || 'other' }`) }}</span>
      </div>
      <div
          v-if="clusterDetail.kubernetesVersionRaw"
          class="glance-item"
      >
        <label>{{ t('glance.version') }}: </label>
        <span>{{ clusterDetail.kubernetesVersionBase }}</span>
        <span
            v-if="clusterDetail.kubernetesVersionExtension"
            style="font-size: 0.75em"
        >{{ clusterDetail.kubernetesVersionExtension }}</span>
      </div>
      <div class="glance-item">
        <label>{{ t('glance.created') }}: </label>
        <span><LiveDate
            :value="clusterDetail.metadata.creationTimestamp"
            :add-suffix="true"
            :show-tooltip="true"
        /></span>
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
</style>
