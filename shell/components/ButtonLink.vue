<script setup>
import { RouteLocationRaw } from 'vue-router';
defineProps({
  to: {
    type:     RouteLocationRaw,
    required: true,
  },
  linkLabel: {
    type:    String,
    default: '',
  },
  type: {
    type:    String,
    default: 'primary',
  },
  size: {
    type:    String,
    default: 'large'
  }
});
</script>

<template>
  <router-link :to="to">
    <a-button
      :type="type"
      :size="size"
      v-bind="$attrs"
    >
      <slot>
        {{ linkLabel }}
      </slot>
    </a-button>
  </router-link>
</template>
