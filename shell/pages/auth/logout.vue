<script setup>
import { useStore } from "vuex";

const store = useStore();
await store.dispatch("auth/logout", { force: true }, { root: true });
</script>

<template>
  <main class="main-layout">
    <div>
      <h1 v-t="'logout.message'" />
    </div>
  </main>
</template>
