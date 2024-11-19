<script>
import { NAME as LLMOS } from '@shell/config/product/llmos';

export default {
  layout: 'plain',

  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product',
      params: {
        ...route.params,
        product: LLMOS,
      }
    });
  }
};
</script>
