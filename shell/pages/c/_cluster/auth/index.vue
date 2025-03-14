<script setup>
import { onBeforeMount } from 'vue';
import { useRouter, useRoute } from 'vue-router'

import { NAME as AUTH } from '@shell/config/product/auth';
import { MANAGEMENT } from '@shell/config/types';

const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  router.replace({
    name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  AUTH,
        resource: MANAGEMENT.USER,
      }
  });
});
</script>
