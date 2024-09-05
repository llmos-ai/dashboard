<script>
import RoleDetailEdit from '@shell/components/auth/RoleDetailEdit.vue';

export default { components: { RoleDetailEdit } };
</script>
<template>
  <RoleDetailEdit
    v-bind="$attrs"
    @set-subtype="$emit('set-subtype', $event)"
  />
</template>
