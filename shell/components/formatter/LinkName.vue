<script>
import { NAME as LLMOS } from '@shell/config/product/llmos';
import { canViewResource } from '@shell/utils/auth';

export default {
  props: {
    value: {
      type:     null,
      required: true
    },

    type: {
      type:     String,
      required: true,
    },

    namespace: {
      type:    String,
      default: '',
    },

    objectId: {
      type:    String,
      default: '',
    },

    product: {
      type:    String,
      default: LLMOS,
    }
  },

  computed: {
    url() {
      const name = `c-cluster-product-resource${ this.namespace ? '-namespace' : '' }-id`;

      const params = {
        resource:  this.type,
        namespace: this.namespace,
        id:        this.objectId ? this.objectId : this.value,
        product:   this.product || LLMOS,
      };

      return { name, params };
    },

    canViewResource() {
      return canViewResource(this.$store, this.type);
    }
  }
};
</script>

<template>
  <span v-if="value">
    <router-link
      v-if="canViewResource"
      :to="url"
    >
      {{ value }}
    </router-link>
    <template v-else>
      {{ value }}
    </template>
  </span>
</template>
