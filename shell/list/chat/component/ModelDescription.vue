<script>
export default {

  data() {
    return {};
  },

  computed: {
    vendorLogo() {
      return require(`~shell/assets/images/vendor/deepseek.svg`);
    },
  },

  methods: {
    showConfigDialog() {
      // this.$modal.show(this.dialogName);
      this.$emit('showConfigDialog', true);
    },
  }
};
</script>

<template>
  <div class="description">
    <div class="content">
      <img
        class="vendor-logo"
        :src="vendorLogo"
      >
      <span class="name">DeepSeek-R1</span>
    </div>

    <button
      class="btn btn-sm role-link"
      @click="showConfigDialog"
    >
      <i class="icon icon-lg icon-gear " />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.description {
  display: flex;
  flex-grow: 0;
  height: 60px;
  align-items: center;
  justify-content: space-between;

  &.highlight-border {
    border-left: 5px solid var(--primary);
  }
  border-radius: var(--border-radius);
  display: flex;
  padding: 10px;
  margin: 10px;
  box-shadow: 0 0 20px var(--shadow);

  .content {
    display: flex;
    align-items: center;

    .vendor-logo {
      width: 30px;
      height: 30px;
      margin-right: 14px ;
    }

    .name {
      font-size: 17px;
      font-weight: 600;
      line-height: 23.5px;
    }
  }
}
</style>
