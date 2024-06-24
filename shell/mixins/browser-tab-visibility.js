import { mapGetters } from 'vuex';

export default {
  computed: { ...mapGetters(['isSingleProduct']) },
  methods:  {
    setTabVisibilityListener(isAdd) {
      if ((!this.isSingleProduct || this.isSingleProduct?.enableSessionCheck) && this.$config.productEnv !== 'desktop') {
        const method = isAdd ? 'addEventListener' : 'removeEventListener';

        document[method]('visibilitychange', this.visibilityChange, true);
      }
    },
  },

  mounted() {
    this.setTabVisibilityListener(true);
  },
  beforeDestroy() {
    this.setTabVisibilityListener(false);
  },
};
