<template>
  <div class="mt-10">
    <EditInput
      v-if="message.role === 'user'"
      :value="message.content"
    />
    <template v-else>
      <a-card v-if="showCard">
        <MarkedView
          :loading="true"
          :content="props.message.content"
          :reasoningContent="props.message.reasoningContent"
        />
      </a-card>
      <MarkedView
        v-else
        :loading="true"
        :content="props.message.content"
        :reasoningContent="props.message.reasoningContent"
      />
    </template>
  </div>
</template>

<script setup>
import MarkedView from '@shell/components/MarkedView';
import EditInput from '@shell/components/AI/EditInput.vue';

const props = defineProps({
  message: {
    type:     Object,
    required: true,
    default:  () => ({
      role:    '',
      content: '',
    }),
  },
  showCard: {
    type:    Boolean,
    default: true,
  },
});
</script>
