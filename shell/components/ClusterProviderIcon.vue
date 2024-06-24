<script>
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
    small: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    useForIcon() {
      return !!this.cluster?.badge?.iconText;
    }
  }
};
</script>

<template>
  <div
    v-if="cluster"
    class="cluster-icon"
    :class="{'cluster-icon-small': small}"
  >
    <div
      v-if="useForIcon"
      class="cluster-badge-logo"
      :style="{ backgroundColor: cluster.badge.color, color: cluster.badge.textColor }"
    >
      {{ cluster.badge.iconText }}
    </div>
    <img
      v-else-if="cluster.providerNavLogo"
      class="cluster-os-logo"
      :src="cluster.providerNavLogo"
    >
  </div>
</template>

<style lang="scss" scoped>
  .rancher-icon-fill {
    fill: var(--primary);
  }
  .cluster-icon {
    align-items: center;
    display: flex;
    height: 32px;
    justify-content: center;
    width: 32px;
  }

  .cluster-icon-small {
    height: 25px;
    width: 25px;

    .cluster-os-logo {
      width: 25px;
      height: 25px;
    }

    .cluster-badge-logo {
      width: 25px;
      height: 25px;
    }
  }

  .cluster-os-logo {
    width: 32px;
    height: 32px;
  }
  .cluster-local-logo {
    display: flex;
    width: 25px;
  }
  .cluster-badge-logo {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    font-weight: bold;
  }
</style>
