import SteveModel from "@shell/plugins/steve/steve-class";
import { MONITORING_NAMESPACE } from "@shell/utils/monitoring";

export default class ServiceMonitor extends SteveModel {
  applyDefaults() {
    if (this.spec) {
      return this.spec;
    }

    const metadata = {
      namespace: MONITORING_NAMESPACE,
      labels: { release: "llmos-monitoring" },
    };

    this["metadata"] = metadata;
  }

  get _detailLocation() {
    const id = this.id?.replace(/.*\//, "");

    return {
      name: "c-cluster-monitoring-monitor-namespace-id",
      params: {
        cluster: this.$rootGetters["clusterId"],
        id,
        namespace: this.metadata.namespace,
      },
      query: { resource: this.type },
    };
  }

  get doneOverride() {
    return {
      name: "c-cluster-monitoring-monitor",
      params: { cluster: this.$rootGetters["clusterId"] },
      query: { resource: this.type },
    };
  }
}
