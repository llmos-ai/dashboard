<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { POD, WORKLOAD_TYPES, SERVICE, NODE } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import CountGauge from '@shell/components/CountGauge';
import { allHash } from '@shell/utils/promise';
import { mapGetters } from 'vuex';
import { matches } from '@shell/utils/selector';

export default {
  components: {
    Tab,
    Loading,
    ResourceTabs,
    CountGauge,
    ResourceTable,
  },

  mixins: [CreateEditView],

  async fetch() {
    let hasNodes = false;

    try {
      const inStore = this.$store.getters['currentStore']();
      const schema = this.$store.getters[`${ inStore }/schemaFor`](NODE);

      if (schema) {
        hasNodes = true;
      }
    } catch {}

    const hash = {
      allPods:         this.$store.dispatch('cluster/findAll', { type: POD }),
      allServices:     this.$store.dispatch('cluster/findAll', { type: SERVICE }),
      allStatefulSets: this.$store.dispatch('cluster/findAll', { type: WORKLOAD_TYPES.STATEFUL_SET }),
      // Nodes should be fetched because they may be referenced in the target
      // column of a service list item.
      allNodes:        hasNodes ? this.$store.dispatch('cluster/findAll', { type: NODE }) : []
    };

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }

    this.findMatchingServices();
  },

  data() {
    return {
      allPods:            [],
      allServices:        [],
      matchingServices:   [],
      allNodes:           [],
      showMetrics:        false,
      showProjectMetrics: false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    podSchema() {
      return this.$store.getters['cluster/schemaFor'](POD);
    },

    serviceSchema() {
      return this.$store.getters['cluster/schemaFor'](SERVICE);
    },

    podTemplateSpec() {
      if ( this.value.type === WORKLOAD_TYPES.CRON_JOB ) {
        return this.value.spec.jobTemplate.spec.template.spec;
      }

      // This is for viewing
      if ( this.value.type === POD ) {
        return this.value;
      }

      return this.value.spec?.template?.spec;
    },

    container() {
      return this.podTemplateSpec?.containers[0];
    },

    serviceHeaders() {
      return this.$store.getters['type-map/headersFor'](this.serviceSchema);
    },

    podHeaders() {
      return this.$store.getters['type-map/headersFor'](this.podSchema).filter((h) => h !== NAMESPACE_COL);
    },

    showPodGaugeCircles() {
      const podGauges = Object.values(this.value.podGauges);
      const total = this.value.pods.length;

      return !podGauges.find((pg) => pg.count === total);
    },
  },
  methods: {
    findMatchingServices() {
      if (!this.serviceSchema) {
        return [];
      }
      const matchingPods = this.value.pods;

      // Find Services that have selectors that match this
      // workload's Pod(s).
      const matchingServices = this.allServices.filter((service) => {
        const selector = service.spec.selector;

        for (let i = 0; i < matchingPods.length; i++) {
          const pod = matchingPods[i];

          if (service.metadata?.namespace === this.value.metadata?.namespace && matches(pod, selector)) {
            return true;
          }
        }

        return false;
      });

      this.matchingServices = matchingServices;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h3>
      {{ t('workload.detailTop.pods') }}
    </h3>
    <div
      v-if="value.pods"
      class="gauges mb-20"
      :class="{'gauges__pods': !!value.pods}"
    >
      <template>
        <CountGauge
          v-for="(group, key) in value.podGauges"
          :key="key"
          :total="value.pods.length"
          :useful="group.count || 0"
          :graphical="showPodGaugeCircles"
          :primary-color-var="`--sizzle-${group.color}`"
          :name="key"
        />
      </template>
    </div>
    <ResourceTabs
      :value="value"
      :need-related="false"
    >
      <Tab
        name="pods"
        :label="t('tableHeaders.pods')"
        :weight="4"
      >
        <ResourceTable
          v-if="value.pods"
          :rows="value.pods"
          :headers="podHeaders"
          key-field="id"
          :schema="podSchema"
          :groupable="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="showMetrics"
        :label="t('workload.container.titles.metrics')"
        name="workload-metrics"
        :weight="3"
      />
      <Tab
        name="services"
        :label="t('workload.detail.services')"
        :weight="3"
      >
        <p
          v-if="!serviceSchema"
          class="caption"
        >
          {{ t('workload.detail.cannotViewServices') }}
        </p>
        <p
          v-else-if="matchingServices.length === 0"
          class="caption"
        >
          {{ t('workload.detail.cannotFindServices') }}
        </p>
        <p
          v-else
          class="caption"
        >
          {{ t('workload.detail.serviceListCaption') }}
        </p>
        <ResourceTable
          v-if="serviceSchema && matchingServices.length > 0"
          :rows="matchingServices"
          :headers="serviceHeaders"
          key-field="id"
          :schema="serviceSchema"
          :groupable="false"
          :search="false"
          :table-actions="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang='scss' scoped>
.right-align {
  float: right;
}
.gauges {
  display: flex;
  justify-content: space-around;
  &>*{
    flex: 1;
    margin-right: $column-gutter;
  }
  &__pods {
    flex-wrap: wrap;
    justify-content: left;
    .count-gauge {
      width: 23%;
      margin-bottom: 10px;
      flex: initial;
    }
  }
}
.caption {
  margin-bottom: .5em;
}
</style>
