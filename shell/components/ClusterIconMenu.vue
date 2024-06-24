<script>
import { abbreviateClusterName } from '@shell/utils/cluster';

export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    isEnabled() {
      return !!this.cluster?.ready;
    },
    showLocalIcon() {
      return this.cluster.isLocal && !this.cluster.badge?.iconText;
    },
    badgeLogoBorderBottom() {
      const color = this.cluster.badge?.color;

      return color ? `4px solid ${ color }` : '';
    }
  },
  methods: {
    smallIdentifier(input) {
      if (this.cluster.badge?.iconText) {
        return this.cluster.badge?.iconText;
      }

      if (this.cluster.isLocal && !this.cluster.badge?.iconText) {
        return undefined;
      }

      return abbreviateClusterName(input);
    }
  }
};
</script>

<template>
  <div
    v-if="cluster"
    class="cluster-icon-menu"
  >
    <div
      class="cluster-badge-logo"
      :class="{ 'disabled': !isEnabled }"
      :style="{ borderBottom: badgeLogoBorderBottom }"
    >
      <span
        class="cluster-badge-logo-text"
      >
        {{ smallIdentifier(cluster.label) }}
      </span>
      <img
          v-if="showLocalIcon"
          class="cluster-local-logo"
          :src="cluster.providerNavLogo"
      >
    </div>
    <i
      v-if="cluster.pinned"
      class="icon icon-pin cluster-pin-icon"
    />
  </div>
</template>

<style lang="scss" scoped>

  .cluster-icon-menu {
    position: relative;
    align-items: center;
    display: flex;
    height: 28px;
    justify-content: center;
    width: 42px;
  }
  .cluster-pin-icon {
    position: absolute;
    top: -6px;
    right: -4px;
    font-size: 12px;
    transform: scaleX(-1);
    color: var(--body-text);
  }

  .cluster-local-logo {
    width: 20px;
  }

  .cluster-badge-logo {
    width: 42px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--default-active-text);
    font-weight: bold;
    background: var(--nav-icon-badge-bg);
    border: 1px solid var(--default-border);
    border-radius: 5px;
    font-size: 12px;
    text-transform: uppercase;

    &.disabled {
      filter: grayscale(1);
      color: var(--muted);
    }
  }
</style>
