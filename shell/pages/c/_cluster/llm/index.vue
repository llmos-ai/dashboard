<script>
import { NAME as LLM } from '@shell/config/product/llm';
import { NODE } from '@shell/config/types';

export default {
  layout: 'plain',

  middleware({ redirect, route, store } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  LLM,
        resource: NODE,
      }
    });
  }
};
</script>
