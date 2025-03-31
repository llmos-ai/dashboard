<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

const store = useStore();
const { t } = useI18n(store);

const props = defineProps({
  value: {
    type:     [String, Number, Boolean, Object],
    required: true,
  },
  buttonStyle: {
    type:    String,
    default: 'solid',
  },
  inactiveClass: {
    type:    String,
    default: '',
  },
  activeClass: {
    type:    String,
    default: 'primary',
  },
  options: {
    type:     Array,
    required: true,
  },
  size: {
    type:    String,
    default: 'large',
  },
  iconSize: {
    type:    String,
    default: null,
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value']);

const optionObjects = computed(() => {
  const value = props.value;

  return props.options.map((opt) => {
    let out;

    if (opt && typeof opt === 'object' && typeof opt.value !== 'undefined') {
      out = { ...opt };
    } else {
      out = { label: opt, value: opt };
    }

    const active = value === out.value;

    out.class = {
      btn:                   true,
      [props.inactiveClass]: !active,
      [props.activeClass]:   active,
      active:                active ? props.activeClass : props.inactiveClass,
    };

    return out;
  });
});

const change = (value) => {
  emit('update:value', value);
};

const actionDescription = (opt) => {
  const tooltip = opt.tooltipKey ? t(opt.tooltipKey) : opt.tooltip;
  const label = opt.labelKey ? t(opt.labelKey) : opt.label;

  return tooltip || label || '';
};

const actionAriaLabel = (opt) => {
  const ariaLabel = opt.ariaLabel;
  const label = opt.labelKey ? t(opt.labelKey) : opt.label;
  const tooltip = opt.tooltipKey ? t(opt.tooltipKey) : opt.tooltip;

  return ariaLabel || tooltip || label || undefined;
};
</script>

<template>
  <a-radio-group
    :value="value"
    :button-style="buttonStyle"
  >
    <a-radio-button
      v-for="(opt, idx) in optionObjects"
      :key="idx"
      v-clean-tooltip="opt.tooltipKey ? t(opt.tooltipKey) : opt.tooltip"
      :value="opt.value"
      :type="opt.active"
      :size="size"
      :aria-label="actionAriaLabel(opt)"
      @click="change(opt.value)"
    >
      <i
        v-if="opt.icon"
        :class="{
          icon: true,
          [opt.icon]: true,
          [`icon-${props.iconSize}`]: !!props.iconSize,
        }"
        :alt="actionAriaLabel(opt)"
      />

      <span v-if="opt.labelKey">
        {{ t(opt.labelKey) }}
      </span>
      <span v-else-if="opt.label">{{ opt.label }}</span>
    </a-radio-button>
  </a-radio-group>
</template>
