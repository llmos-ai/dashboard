<script lang="ts" setup>
import { ref, computed, useTemplateRef } from 'vue';
import LabelWrapper from './LabelWrapper.vue';

const model = defineModel({
  type:    String,
  default: '',
});
const props = defineProps({
  options: {
    type:    Array,
    default: () => [],
  },
  placeholder: {
    type:    String,
    default: '',
  },
  label: {
    type:    String,
    default: '',
  },
  required: {
    type:    Boolean,
    default: false,
  },
  disabled: {
    type:    Boolean,
    default: false,
  },
  allowClear: {
    type:    Boolean,
    default: false,
  },
  backfill: {
    type:    Boolean,
    default: false,
  },
  defaultOpen: {
    type:    Boolean,
    default: false,
  },
  dropdownMatchSelectWidth: {
    type:    [Boolean, Number],
    default: true,
  },
  filterOption: {
    type:    [Boolean, Function],
    default: true,
  },
  popupClassName: {
    type:    String,
    default: '',
  },
  defaultValue: {
    type:    [String, Number, Array],
    default: '',
  },
  notFoundContent: {
    type:    String,
    default: '没有找到匹配项',
  },
  size: {
    type:    String,
    default: 'small',
  },
  status: {
    type:    String,
    default: '',
  },
});

const normalizedOptions = computed(() => {
  return props.options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }
    if (typeof option === 'object' && option.value && !option.label) {
      return { ...option, label: option.value };
    }

    return option;
  });
});

const emit = defineEmits([
  'update:value',
  'change',
  'select',
  'focus',
  'blur',
  'dropdownVisibleChange',
  'search',
]);

const value = ref(props.defaultValue);
const focused = ref(false);

const updateValue = (val) => {
  value.value = val;
  emit('change', val);
  emit('update:value', val);
};

const handleSelect = (val, option) => {
  emit('select', val, option);
};

const handleFocus = (e) => {
  focused.value = true;
  emit('focus', e);
};

const handleBlur = (e) => {
  focused.value = false;
  emit('blur', e);
};

const handleDropdownVisibleChange = (open) => {
  emit('dropdownVisibleChange', open);
};

const handleSearch = (value) => {
  emit('search', value);
};

const autoCompleteRef = useTemplateRef('autoCompleteRef');

const focusInput = () => {
  if (autoCompleteRef.value && !props.disabled) {
    autoCompleteRef.value.focus();
  }
};
</script>

<template>
  <LabelWrapper
    :label="label"
    :required="required"
    :focused="focused"
    :disabled="disabled"
    :has-value="!!model"
    :status="status"
    @focus="focusInput"
  >
    <a-auto-complete
      ref="autoCompleteRef"
      v-model:value="model"
      :bordered="false"
      :options="normalizedOptions"
      :placeholder="placeholder"
      :disabled="disabled"
      :allow-clear="allowClear"
      :backfill="backfill"
      :default-open="defaultOpen"
      :dropdown-match-select-width="dropdownMatchSelectWidth"
      :filter-option="filterOption"
      :popup-class-name="popupClassName"
      :not-found-content="notFoundContent"
      :size="size"
      :status="status"
      style="width: 100%"
      @change="updateValue"
      @select="handleSelect"
      @focus="handleFocus"
      @blur="handleBlur"
      @dropdown-visible-change="handleDropdownVisibleChange"
      @search="handleSearch"
    >
      <template
        v-if="$slots.default"
        #default
      >
        <slot />
      </template>

      <template
        v-if="$slots.option"
        #option="{ value: optionValue, label, ...restProps }"
      >
        <slot
          name="option"
          :value="optionValue"
          :label="label"
          v-bind="restProps"
        />
      </template>

      <template
        v-if="$slots.dropdownRender"
        #dropdownRender="dropdownProps"
      >
        <slot
          name="dropdownRender"
          v-bind="dropdownProps"
        />
      </template>

      <template
        v-if="$slots.prefix"
        #prefix
      >
        <slot name="prefix" />
      </template>

      <template
        v-if="$slots.suffix"
        #suffix
      >
        <slot name="suffix" />
      </template>

      <template
        v-if="$slots.clearIcon"
        #clearIcon
      >
        <slot name="clearIcon" />
      </template>

      <template
        v-if="$slots.notFoundContent"
        #notFoundContent
      >
        <slot name="notFoundContent" />
      </template>
    </a-auto-complete>
  </LabelWrapper>
</template>

<style lang="scss" scoped>
:deep(.ant-select) {
  width: 100%;
}

:deep(.ant-select-selector) {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.ant-select-selection-search) {
  left: 0 !important;
}
</style>
