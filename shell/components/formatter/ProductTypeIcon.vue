<script>
import IconOrSvg from '@shell/components/IconOrSvg';
export default {
  components: { IconOrSvg },
  props:      {
    row: {
      type:     Object,
      required: true
    },

    value: {
      type:    String,
      default: ''
    },
  },

  computed: {
    logo() {
      try {
        return require(`~shell/assets/images/pl/${ this.value }.svg`);
      } catch (e) {
        return false;
      }
    },
  },
};
</script>

<template>
  <span>
    <img
      v-if="value"
      :src="logo"
    >
    <span v-else>{{ value }}</span>
  </span>
</template>

<style lang="scss" scoped>
</style>
