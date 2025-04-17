<script lang="ts" setup>
const props = defineProps({
  label: {
    type:    String,
    default: '',
  },
  required: {
    type:    Boolean,
    default: false,
  },
  focused: {
    type:    Boolean,
    default: false,
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
  hasValue: {
    type:    Boolean,
    default: false,
  },
  status: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['focus']);

const handleClick = () => {
  if (!props.disabled) {
    emit('focus');
  }
};
</script>

<template>
  <div
    class="label-wrapper"
    :class="{
      'disabled': disabled,
      'focused': focused,
      'has-value': hasValue,
      [status]: status
    }"
    @click="handleClick"
  >
    <div
      v-if="label"
      class="labeled-container"
    >
      <label>
        {{ label }}
        <span
          v-if="required"
          class="required"
        >
          *
        </span>
      </label>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.label-wrapper {
  position: relative;
  border: 1px solid var(--input-border, #dcdee2);
  border-radius: 4px;
  background-color: var(--input-bg, white);
  transition: all 0.3s;
  padding: 0px 11px 10px 11px;

  &:hover {
    border-color: var(--input-hover-border, #40a9ff);
  }

  &.focused {
    border-color: var(--input-focus-border, #40a9ff);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  &.disabled {
    background-color: var(--input-disabled-bg, #f5f5f5);
    border-color: var(--input-border, #dcdee2);
    cursor: not-allowed;

    .labeled-container label {
      color: var(--input-disabled-text, rgba(0, 0, 0, 0.25));
    }
  }

  &.error {
    border-color: var(--error, #ff4d4f);
  }

  &.warning {
    border-color: var(--warning, #faad14);
  }

  .labeled-container {
    label {
      font-size: 12px;
      color: var(--input-label, rgba(0, 0, 0, 0.65));
      display: block;
      margin-bottom: 2px;

      .required {
        color: var(--error, #ff4d4f);
        margin-left: 2px;
      }
    }
  }

  .content {
    width: 100%;
  }
}
</style>
