<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const pageActions = computed(() => store.getters.pageActions);

const pageAction = (_event: Event, action: string) => {
  store.dispatch('handlePageAction', action).then(() => {
    // store.dispatch('refresh');
    // TODO: message
  });
};
</script>

<template>
  <a-dropdown trigger="click">
    <a class="ant-dropdown-link px-[6px] cursor-pointer" @click.prevent>
      <i class="icon icon-actions text-xl text-black mt-[4px]" />
    </a>

    <template #overlay>
      <a-menu>
        <a-menu-item v-for="option in pageActions" :key="option.action">
          <a-divider v-if="option.separator" />
          <span v-else-if="option.labelKey" @click="pageAction($event, option.action)">
            {{ t(option.labelKey) }}
          </span>
          <span v-else @click="pageAction($event, option.label)">{{ option.label }}</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>
:deep() .ant-divider-horizontal {
  margin: 0;
}
</style>