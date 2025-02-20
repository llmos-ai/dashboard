<script>
import ButtonGroup from '@/shell/components/ButtonGroup.vue';

export default {
  name: 'ChatHeader',

  components: { ButtonGroup },

  props: {
    option: {
      type:     String,
      required: true,
    }
  },

  data() {
    const options = [
      {
        label: '对话',
        value: 'chat',
      },
      {
        label: '模型比较',
        value: 'compare',
      },
    ];

    return {
      options,
      chatType: this.option
    };
  },

  methods: {
    input() {
      this.$emit('changeChatType', this.chatType);
    },

  }
};
</script>

<template>
  <div class="top-bar mb-10">
    <h1 class="mb-0">
      Chat
    </h1>
    <ButtonGroup
      v-model="chatType"
      :options="options"
      @input="input"
    />
  </div>
</template>

<style lang="scss" scoped>

.top-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
