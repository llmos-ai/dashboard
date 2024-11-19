<script>
import { NAME as LLMOS } from '@shell/config/product/llmos';
import { ML_WORKLOAD_TYPES, NODE } from '@shell/config/types';

export default {
  layout: 'plain',
  middleware({ redirect, route, store } ) {
    const user = store.getters['auth/user'];

    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  LLMOS,
        resource: user.status?.isAdmin ? NODE : ML_WORKLOAD_TYPES.RAY_CLUSTER,
      }
    });
  }
};
</script>
