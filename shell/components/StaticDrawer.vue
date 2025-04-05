<script setup>
defineProps({
  open: {
    type:    Boolean,
    default: false
  },
  title: {
    type:    String,
    default: ''
  }
});
</script>

<template>
  <div
    class="border-gray-200 transition-all duration-300 ease-in-out overflow-hidden"
    :class="[open ? 'border-l' : '!w-0']"
  >
    <div class="p-6 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>
