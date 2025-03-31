<script setup>
import CopyToClipboard from '@shell/components/CopyToClipboard';

defineProps({
  value: {
    type:    String,
    default: ''
  },
  showLabel: {
    type:    Boolean,
    default: true
  }
});
</script>

<template>
  <span>
    <span v-if="showLabel">
      {{ value }}
    </span>
    <CopyToClipboard
      label-as="tooltip"
      :text="value"
      class="icon-btn"
      action-color="bg-transparent"
    />
  </span>
</template>
