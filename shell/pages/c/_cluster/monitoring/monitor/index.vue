<script>
import Loading from "@shell/components/Loading";
import Tabbed from "@shell/components/Tabbed";
import Tab from "@shell/components/Tabbed/Tab";
import TypeDescription from "@shell/components/TypeDescription";

import ResourceTable from "@shell/components/ResourceTable";
import { MONITORING } from "@shell/config/types";
import { allHash } from "@shell/utils/promise";
export default {
  components: {
    Loading,
    Tabbed,
    Tab,
    ResourceTable,
    TypeDescription,
  },

  async fetch() {
    this.serviceMonitorSchema = this.$store.getters["cluster/schemaFor"](
      MONITORING.SERVICE_MONITOR
    );
    this.podMonitorSchema = this.$store.getters["cluster/schemaFor"](
      MONITORING.POD_MONITOR
    );

    const hash = await allHash({
      serviceMonitors: this.$store.dispatch("cluster/findAll", {
        type: MONITORING.SERVICE_MONITOR,
      }),
      podMonitors: this.$store.dispatch("cluster/findAll", {
        type: MONITORING.POD_MONITOR,
      }),
    });

    this.serviceMonitors = hash.serviceMonitors;
    this.podMonitors = hash.podMonitors;
  },

  data() {
    const initTab = this.$route.query.resource || MONITORING.SERVICE_MONITOR;

    return {
      serviceMonitorSchema: null,
      podMonitorSchema: null,
      serviceMonitors: [],
      podMonitors: [],
      initTab,
    };
  },

  computed: {
    createRoute() {
      const activeResource =
        this.$refs?.tabs?.activeTabName || this.routeSchema.id;

      return {
        name: "c-cluster-monitoring-monitor-create",
        params: { cluster: this.$route.params.cluster },
        query: { resource: activeResource },
      };
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row header mb-20">
      <h1 class="flex flex-1">{{ t("monitoring.monitors") }}</h1>
      <div>
        <a-button
          type="primary"
          class="float right"
          @click="$router.push(createRoute)"
        >
          {{ t("resourceList.head.createFromYaml") }}
        </a-button>
      </div>
    </div>
    <Tabbed ref="tabs" :default-tab="initTab">
      <Tab
        :name="serviceMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](serviceMonitorSchema, 2)"
        :weight="2"
      >
        <TypeDescription :resource="serviceMonitorSchema.id" />
        <ResourceTable :schema="serviceMonitorSchema" :rows="serviceMonitors" />
      </Tab>
      <Tab
        :name="podMonitorSchema.id"
        :label="$store.getters['type-map/labelFor'](podMonitorSchema, 2)"
        :weight="1"
      >
        <TypeDescription :resource="podMonitorSchema.id" />
        <ResourceTable :schema="podMonitorSchema" :rows="podMonitors" />
      </Tab>
    </Tabbed>
  </div>
</template>
