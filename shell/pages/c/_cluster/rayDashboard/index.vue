<script>
import { SERVICE } from '@shell/config/types';
import { fetchClusterResources } from '@shell/pages/c/_cluster/explorer/explorer-utils';

export default {
  layout: 'rayDashboard',
  async asyncData({ route, redirect, store }) {
    // TODO: fetch
    const services = await fetchClusterResources(store, SERVICE);
    const id = route.params.id;
    const namespace = route.params.namespace;

    let dashboardUrl = '';

    if (services && services.length > 0) {
      // find service by svc name and namespace
      const svc = services.find((s) => {
        return s.metadata.ownerReferences?.find((o) => o.name === id);
      });
      const port = svc.spec.ports.find((p) => p.port === 8265);

      dashboardUrl = `${ window.location.origin }/api/v1/namespaces/${ namespace }/services/http:${ svc.name }:${ port.name }/proxy/#/overview`;
    }

    return {
      services,
      dashboardUrl,
    };
  },

  data() {
    return {
      services: [],
      dashboardUrl: '',
    };
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
