<script>
export default {
  props: {
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
      return require(`@shell/assets/images/connect.svg`);
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="value"
    >
      <span class="icon icon-endpoints_connected icon-lg pull-left"></span>
      <a
        target="_blank"
        :href="value"
        class="connect-success"
      >
        Connect
      </a>
    </div>
    <span v-else>Connect</span>
  </div>
</template>

<style lang="scss" scoped>
.connect-success {
  display: flex;
  align-items: center;
}
img {
  margin-left: 5px;
  height: 18px;
}
</style>
