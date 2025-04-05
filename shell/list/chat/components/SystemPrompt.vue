<script setup>
import { ref } from 'vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { SYSTEM_PROMPT_TEMPLATE } from '@shell/config/constants';

defineProps({
  systemPrompt: {
    type:    String,
    default: () => ''
  }
});

const emits = defineEmits(['update:systemPrompt']);

const promptTemplate = ref(null);
const update = (content) => {
  emits('update:systemPrompt', content);
};

const SYSTEM_PROMPT_TEMPLATE_OPTIONS = SYSTEM_PROMPT_TEMPLATE.map((template) => {
  return {
    label: template.label,
    value: template.content
  };
});
</script>

<template>
  <div class="mb-10">
    <LabeledSelect
      v-model:value="promptTemplate"
      :label="t('chat.label.systemPromptTemplate')"
      :placeholder="t('chat.label.systemPromptTemplatePlaceholder')"
      :options="SYSTEM_PROMPT_TEMPLATE_OPTIONS"
      class="mb-10"
      @update:value="update"
    />

    <LabeledInput
      :value="systemPrompt"
      class="mt-5"
      :auto-size="{ minRows: 2, maxRows: 6 }"
      :label="t('chat.label.systemPrompt')"
      type="multiline"
      @update:value="update"
    />
  </div>
</template>
