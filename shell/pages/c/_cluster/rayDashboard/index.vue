<script>
export default {
  layout: 'authenticated',

  components: {},

  data() {
    const clusterName = this.$route.params.clusterName;
    const namespace = this.$route.params.namespace;

    const dashboardUrl = `${ window.location.origin }/api/v1/namespaces/${ namespace }/services/http:${ clusterName }-head-svc:dashboard/proxy/#/overview`;

    return { dashboardUrl };
  },
};
</script>

<template>
  <div>
    <iframe
      id="ray-dashboard"
      title="ray-dashboard"
      width="100%"
      height="100%"
      frameborder="0"
      border="0"
      :src="dashboardUrl"
    />
  </div>
</template>

<style lang="scss" scoped>
.main-layout .outlet {
  padding: 0px;
  height: 100px;
}
</style>
