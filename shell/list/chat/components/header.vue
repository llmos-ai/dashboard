<script setup>
import { useStore } from "vuex";
import { useI18n } from "@shell/composables/useI18n";
import ButtonGroup from "@/shell/components/ButtonGroup.vue";

const store = useStore();
const { t } = useI18n(store);

const chatType = defineModel("type");

const options = [
  {
    label: t("chat.type.chat"),
    value: "chat",
  },
  {
    label: t("chat.type.compare"),
    value: "compare",
  },
];
</script>

<template>
  <div class="flex justify-between items-center">
    <h1 class="mb-0">
      {{ t("chat.type.chat") }}
    </h1>
    <ButtonGroup
      v-model:value="chatType"
      :options="options"
      @update:value="input"
    />
  </div>
</template>
