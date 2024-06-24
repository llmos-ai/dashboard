<script>
import { NAME as SETTINGS } from '@shell/config/product/settings';
import { MANAGEMENT } from '@shell/config/types';

export default {
  layout: 'plain',

  middleware({ redirect, route, store } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  SETTINGS,
        resource: MANAGEMENT.SETTING,
      }
    });
  }
};
</script>
