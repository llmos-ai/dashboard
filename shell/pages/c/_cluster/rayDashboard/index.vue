<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { SERVICE } from '@shell/config/types';
import { fetchClusterResources } from '@shell/pages/c/_cluster/explorer/explorer-utils';

const route = useRoute();
const store = useStore();

const services = ref([]);
const dashboardUrl = ref('');

onMounted(async() => {
  services.value = await fetchClusterResources(store, SERVICE);

  const id = route.params.id;
  const namespace = route.params.namespace;

  if (services.value && services.value.length > 0) {
    const svc = services.value.find((s) => s.metadata.ownerReferences?.find((o) => o.name === id)
    );

    if (svc) {
      const port = svc.spec.ports.find((p) => p.port === 8265);

      if (port) {
        dashboardUrl.value = `${ window.location.origin }/api/v1/namespaces/${ namespace }/services/http:${ svc.metadata.name }:${ port.name }/proxy/#/overview`;
      }
    }
  }
});
</script>

<script>
export default {
  setup() {

  }
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
