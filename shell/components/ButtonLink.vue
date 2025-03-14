<script setup>
import { RouteLocationRaw } from 'vue-router';
const props = defineProps({
  to: {
    type: RouteLocationRaw,
    required: true,
  },
  linkLabel: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'primary',
  },
});
</script>

<template>
  <router-link :to="to">
    <a-button :type="type" :size="size" v-bind="$attrs">
      <slot>
        {{ linkLabel }}
      </slot>
    </a-button>
  </router-link>
</template>
