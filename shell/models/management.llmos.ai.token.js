import SteveModel from "@shell/plugins/steve/steve-class";
import { DESCRIPTION } from "@shell/config/labels-annotations";

import { set } from "@shell/utils/object";
import day from "dayjs";

export default class Token extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: "management.llmos.ai/v1",
      kind: "Token",
      metadata: {
        generateName: "llmos-",
        labels: {},
        annotations: {},
      },
      spec: {
        authProvider: "local",
        expired: true,
        userId: null,
      },
    };

    this["metadata"] = value.metadata;
    set(this, "spec", this.spec || value.spec);
  }

  get _availableActions() {
    return super._availableActions.filter((a) =>
      ["viewInApi", "promptRemove"].includes(a.action)
    );
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION];
  }

  get state() {
    return this.isExpired ? "expired" : "active";
  }

  get expiresAt() {
    return this.status?.expiresAt;
  }

  get isExpired() {
    // Keep this updated, don't trust `expired`
    const expiry = day(this.expiresAt);

    return expiry.isBefore(day());
  }
}
