<script>
import Brand from '@shell/mixins/brand';

export default {
  mixins:     [Brand],
};
</script>

<template>
  <main class="main-layout">
    <router-view :key="$route.path" />
  </main>
</template>

<style lang="scss" scoped>
</style>
