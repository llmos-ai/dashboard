import SteveModel from "@shell/plugins/steve/steve-class";

import { set } from "@shell/utils/object";

export default class CephBlockPool extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: "ceph.rook.io/v1",
      kind: "CephBlockPool",
      metadata: {
        name: "",
        namespace: "storage-system",
        labels: {},
        annotations: {},
      },
      spec: {
        failureDomain: "host",
        replicated: { size: 3 },
      },
    };

    this["metadata"] = value.metadata;
    set(this, "spec", this.spec || value.spec);
  }

  get isLLMOSRelease() {
    return (
      this.annotations?.["meta.helm.sh/release-name"] === "llmos-ceph-cluster"
    );
  }

  get canDelete() {
    // not include llmos-ceph-cluster
    return !this.isLLMOSRelease && super.canDelete;
  }

  get canUpdate() {
    return !this.isLLMOSRelease && super.canUpdate;
  }
}
