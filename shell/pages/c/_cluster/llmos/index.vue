<script setup>
import { onBeforeMount } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { ML_WORKLOAD_TYPES, NODE } from '@shell/config/types';

import { NAME as LLMOS } from '@shell/config/product/llmos';

const store = useStore();
const route = useRoute();
const router = useRouter();
const user = store.getters['auth/user'];

onBeforeMount(() => {
  router.replace({
    name:   'c-cluster-product-resource',
    params: {
      ...route.params,
      product:  LLMOS,
      resource: user.status?.isAdmin ? NODE : ML_WORKLOAD_TYPES.RAY_CLUSTER,
    },
  });
});
</script>
