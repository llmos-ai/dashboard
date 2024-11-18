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
      <a
        target="_blank"
        :href="value"
        class="connect-success"
      >
        Visit <i class="icon icon-external-link" />
      </a>
    </div>
    <span v-else>
      Visit <i class="icon icon-external-link" />
    </span>
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
.icon-external-link {
  padding-left: 5px;
}
</style>
