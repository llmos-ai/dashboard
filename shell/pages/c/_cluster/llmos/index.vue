<script setup>
import { onBeforeMount } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { MANAGEMENT } from "@shell/config/types";

import { NAME as LLMOS } from "@shell/config/product/llmos";
import { ML_WORKLOAD_TYPES, NODE } from "@shell/config/types";

const store = useStore();
const route = useRoute();
const router = useRouter();
const user = store.getters["auth/user"];

onBeforeMount(() => {
  const hasSettings = !!store.getters[`management/schemaFor`](
    MANAGEMENT.SETTING
  );
  router.replace({
    name: "c-cluster-product-resource",
    params: {
      ...route.params,
      product: LLMOS,
      resource: user.status?.isAdmin ? NODE : ML_WORKLOAD_TYPES.RAY_CLUSTER,
    },
  });
});
</script>
