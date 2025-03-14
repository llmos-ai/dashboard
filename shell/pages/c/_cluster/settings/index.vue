<script setup>
import { onBeforeMount } from 'vue';
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { NAME as SETTINGS } from '@shell/config/product/settings';
import { MANAGEMENT } from '@shell/config/types';

const store = useStore()
const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  const hasSettings = !!store.getters[`management/schemaFor`](MANAGEMENT.SETTING);
  router.replace({
    name:   'c-cluster-product-resource',
    params: {
      ...route.params,
      product:  SETTINGS,
      resource: hasSettings ? MANAGEMENT.SETTING : MANAGEMENT.FEATURE,
    }
  });
});
</script>
