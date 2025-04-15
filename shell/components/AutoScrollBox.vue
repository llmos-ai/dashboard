<script setup>
import { useTemplateRef } from 'vue';
import useAutoScrollWithControl from '@shell/composables/useAutoScrollWithControl';

const scrollContainer = useTemplateRef('scrollContainer');
const observerTarget = useTemplateRef('observerTarget');

useAutoScrollWithControl(scrollContainer, observerTarget);
</script>

<template>
  <div ref="scrollContainer">
    <slot name="default" />

    <div
      ref="observerTarget"
      class="h-[1px]"
    />
  </div>
</template>
