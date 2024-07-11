export default {
  methods: {
    setTabVisibilityListener(isAdd) {
      const method = isAdd ? 'addEventListener' : 'removeEventListener';

      document[method]('visibilitychange', this.visibilityChange, true);
    },
  },

  mounted() {
    this.setTabVisibilityListener(true);
  },
  beforeDestroy() {
    this.setTabVisibilityListener(false);
  },
};
