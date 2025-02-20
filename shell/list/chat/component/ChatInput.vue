<script>
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';

export default {
  components: { LabeledInput, TextAreaAutoGrow },

  props: {
    text: {
      type:    String,
      default: ''
    },

    loading: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      placeholder: 'Type your message here...',
      isFocused:   false,
      question:    this.text
    };
  },
  computed: {
    inputForcedHeight() {
      return (this.isFocused || this.question);
    }
  },

  methods: {
    onInput(value) {
      this.question = value;
      this.$emit('input', this.question);
    },

    submit() {
      this.$emit('handleQuestion', this.question);
    }
  },

  watch: {
    text(value) {
      this.question = value;
    }
  }
};
</script>

<template>
  <div class="ai-chat">
    <LabeledInput
      v-model="question"
      :class="{ 'chat-input': true,'focused': inputForcedHeight }"
      type="multiline"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <template #prefix>
        <div :class="{prefix: true, 'is-focused': inputForcedHeight}">
          <button
            class="btn btn-sm role-link btn-border mr-5"
            :disabled="true"
          >
            已联网
          </button>
        </div>
      </template>
      <template #field>
        <TextAreaAutoGrow
          v-bind="$attrs"
          :maxlength="null"
          :minHeight="inputForcedHeight ? 80 : 25"
          :value="question"
          :placeholder="placeholder"
          autocapitalize="off"
          class="textarea"
          :style="{ height: inputForcedHeight ? inputForcedHeight + 'px' : 'auto' }"
          @input="onInput($event)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
      </template>
      <template #suffix>
        <div
          v-if="!loading"
          :class="{suffix: true, 'is-focused': inputForcedHeight}"
          @click="submit"
        >
          <span class="iconfont icon-send-fill" />
        </div>
        <div
          v-else
          :class="{suffix: true, 'is-focused': inputForcedHeight}"
        >
          <button
            type="button"
            class="btn btn-sm role-link"
            disabled
          >
            <span class="icon icon-spinner " />
          </button>
        </div>
      </template>
    </LabeledInput>
  </div>
</template>

<style lang="scss" scoped>
.ai-chat {
  display: flex;
  width: 100%;

  .icon-send-fill {
    color: var(--primary);
    cursor: pointer;
  }
}

.chat-input {
  display: flex;
  align-items: center;
  padding: 6px 18px;
  border-radius: 12px;
  width: 100%;

  ::v-deep > textarea {
    padding-top: 0px !important;
  }

  .btn-border {
    border: solid 1px var(--primary);
    border-radius: 6px;
  }
}

.chat-input.focused {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto auto;
}

.chat-input.focused .prefix {
  grid-row: 2;
  grid-column: 1;
}

.chat-input.focused .suffix {
  grid-row: 2;
  grid-column: 2;
  justify-self: end;
}

.chat-input.focused .textarea {
  grid-row: 1;
  grid-column: 1 / 3;
  transition: max-height 0.5s ease;
}
</style>
