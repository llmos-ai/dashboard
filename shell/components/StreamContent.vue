<template>
  <div v-if="message.content">
    <EditInput
      v-if="message.role === 'user'"
      :value="message.content"
    />

    <MarkedView
      v-else
      :content="renderedMarkdown"
    />
  </div>
</template>

<script>
import MarkedView from '@shell/components/MarkedView.vue';
import EditInput from '@shell/components/AI/EditInput.vue';

export default {
  components: { EditInput, MarkedView },

  props: {
    message: {
      type: Object,

      default: () => {
        return {
          role:    String,
          content: String
        };
      },
      required: true
    },
  },

  data() {
    return { renderedMarkdown: '' };
  },

  watch: {
    message: {
      immediate: true,

      handler(value) {
        this.renderedMarkdown = value.content;
      },
    },
  }
};
</script>
