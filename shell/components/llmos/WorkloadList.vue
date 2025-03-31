<script>
import { ML_LIST_WORKLOAD_TYPES, NODE, POD, SERVICE } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';

const $loadingResources = ($route, $store) => {
  const allowedResources = [];

  Object.values(ML_LIST_WORKLOAD_TYPES).forEach((type) => {
    // You may not have RBAC to see some of the types
    if ($store.getters['cluster/schemaFor'](type)) {
      allowedResources.push(type);
    }
  });

  return { loadResources: [$route.params.resource] };
};

export default {
  name:       'LLMOSWorkloadList',
  components: { ResourceTable },
  mixins:     [ResourceFetch],

  props: {
    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },
    dashboardName: {
      type:    String,
      default: ''
    }
  },

  async fetch() {
    if (this.loadResources.length) {
      this.$initializeFetchData(this.loadResources[0], this.loadResources);
    } else {
      this.$initializeFetchData(this.$route.params.resource);
    }

    this.$fetchType(NODE);
    this.$fetchType(SERVICE);
    this.loadHeathResources();

    const type = this.$route.params.resource;

    if (this.$store.getters['cluster/schemaFor'](type)) {
      const resource = await this.$fetchType(type);

      this.resources = [resource];
    }
  },

  data() {
    // Ensure these are set on load (to determine if the NS filter is required) rather than too late on `fetch`
    const loadResources = $loadingResources(this.$route, this.$store);

    return {
      resources: [],
      loadResources,
    };
  },

  computed: {
    filteredRows() {
      const out = [];

      for (const typeRows of this.resources) {
        if (!typeRows) {
          continue;
        }

        for (const row of typeRows) {
          if (!row.ownedByWorkload) {
            out.push(row);
          }
        }
      }

      return out;
    },

    schema() {
      const type = this.$route.params.resource;

      return this.$store.getters['cluster/schemaFor'](type);
    },

    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema, false);
    }
  },

  methods: {
    loadHeathResources() {
      this.$fetchType(POD);
    }
  },
};
</script>

<template>
  <ResourceTable
    :loading="$fetchState.pending"
    :schema="schema"
    :headers="headers"
    :rows="filteredRows"
    :overflow-y="true"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
  >
    <template #col:access="{row}">
      <td>
        <router-link
          class="icon"
          :to="{ name: `c-cluster-product-resource-namespace-id-${dashboardName}`, params: { clusterName: row.name, resource: row.type, namespace: row.namespace, id: row.metadata?.name }}"
        >
          <a-button>
            Manage <i class="icon icon-external-link" />
          </a-button>
        </router-link>
      </td>
    </template>
  </ResourceTable>
</template>
