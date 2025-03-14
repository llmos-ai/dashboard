import SteveModel from "@shell/plugins/steve/steve-class";
import { DESCRIPTION } from "@shell/config/labels-annotations";

import { set } from "@shell/utils/object";
import { _EDIT, ENABLED, MODE } from "@shell/config/query-params";
import { NAME as LLMOS } from "@shell/config/product/llmos";

export const systemAddonLabel = "llmos.ai/system-addon";
export const addonAllowEditLabel = "llmos.ai/system-addon-allow-edit";

const upperCaseWords = ["llmos", "gpu"];

export default class ManagedAddon extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: "management.llmos.ai/v1",
      kind: "ManagedAddon",
      metadata: {
        name: "",
        namespace: "llmos-system",
        labels: {},
        annotations: {},
      },
      spec: {
        enabled: true,
        chart: "",
        repo: "",
        version: "",
        valuesContent: "",
      },
    };

    this.metadata = value.metadata;
    set(this, "spec", this.spec || value.spec);
  }

  get availableActions() {
    const out = super._availableActions;

    const toggleAddon = {
      action: "toggleAddon",
      enabled: this.allowDisable,
      icon: this.spec.enabled ? "icon icon-pause" : "icon icon-play",
      label: this.spec.enabled
        ? this.t("generic.disable")
        : this.t("generic.enable"),
    };

    out.unshift(toggleAddon);

    return out;
  }

  async toggleAddon() {
    const enableHistory = this.spec.enabled;

    try {
      this.goToEdit({ [ENABLED]: !this.spec.enabled });
    } catch (err) {
      this.spec.enabled = enableHistory;
      this.$dispatch(
        "growl/fromError",
        {
          title: this.t("managedAddon.switchFailed", {
            action: enableHistory
              ? this.t("generic.disable")
              : this.t("generic.enable"),
            name: this.metadata.name,
          }),
          err,
        },
        { root: true }
      );
    }
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION];
  }

  get stateColor() {
    const state = this.stateDisplay;

    if ((state === "Deployed" || state === "Ready") && this.stateReady) {
      return "text-success";
    } else if (state === "Disabled") {
      return "text-darker";
    } else if (state === "InProgress") {
      return "text-info";
    } else if (
      state?.toLowerCase().includes("failed") ||
      state?.toLowerCase().includes("error")
    ) {
      return "text-error";
    } else {
      return "text-info";
    }
  }

  get stateDisplay() {
    const out = this?.status?.state;

    if (!out) {
      return "Disabled";
    }

    if (this.stateReady) {
      return "Deployed";
    }

    return out;
  }

  get stateReady() {
    const readyCondition = (this.status?.conditions || []).find(
      (C) => C.type === "Ready"
    );

    return readyCondition?.status === "True";
  }

  get canDelete() {
    return (
      this.metadata?.labels?.[systemAddonLabel] !== "true" && super.canDelete
    );
  }

  get allowDisable() {
    return (
      (this.labels[systemAddonLabel] !== "true" ||
        this.labels[addonAllowEditLabel] === "true") &&
      super.canUpdate
    );
  }

  get logo() {
    let src = null;

    try {
      src = require(`@shell/assets/images/pl/${this.metadata.name}.svg`);
    } catch (e) {
      return null;
    }

    return src;
  }

  get version() {
    // Ensure the version always starts with 'v'
    return this.spec.version.startsWith("v")
      ? this.spec.version
      : `v${this.spec.version}`;
  }

  get formatName() {
    return this.metadata.name
      .split("-")
      .map((word) => {
        if (upperCaseWords.includes(word)) {
          return word.toUpperCase();
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize other words
      })
      .join(" ");
  }

  get editUrl() {
    const query = {
      [MODE]: _EDIT,
      [ENABLED]: "true",
    };

    return {
      name: "c-cluster-product-resource-namespace-id",
      params: {
        product: LLMOS,
        cluster: this.currentRoute()?.params?.cluster || "local",
        resource: this.type,
        namespace: this.namespace,
        id: this.metadata.name,
      },
      query,
    };
  }
}
