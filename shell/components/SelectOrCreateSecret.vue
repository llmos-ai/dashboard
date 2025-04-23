<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { useStore } from 'vuex';

import { AUTH_TYPE } from '@shell/config/types';

import LabeledSelect from '@shell/components/form/LabeledSelect';

const store = useStore();

const props = defineProps({
  value: {
    type:     String,
    required: true,
  },

  mode: {
    type:     String,
    required: true,
  },

  labelKey: {
    type:    String,
    default: 'modelRegistry.accessCredentialSecretName.label',
  },

  placeholder: {
    type:    String,
    default: 'Please select a secret',
  },

  options: {
    type:     Array,
    required: true,
  },

  required: {
    type:    Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:value']);

const selectedValue = ref(props.value || '');

const onSecretSelected = (selected) => {
  let value = '';

  if (typeof selected === 'object') {
    value = selected.value;
  } else {
    value = selected;
  }

  if (value === AUTH_TYPE._S3) {
    store.dispatch('cluster/promptModal', {
      component:      'CreateSecretModal',
      modalWidth:     '1000px',
      componentProps: {
        beforeClose: () => {
          selectedValue.value = '';

          emit('update:value', '');
        },
        saveCb: (model) => {
          selectedValue.value = model.metadata.name;

          emit('update:value', selectedValue.value);
        }
      },
    });
  } else {
    emit('update:value', value);
  }
};
</script>

<script>
export default {
  setup() {

  }
};
</script>

<template>
  <LabeledSelect
    v-model:value="selectedValue"
    :options="options"
    :mode="mode"
    :multiple="false"
    :label-key="labelKey"
    :placeholder="placeholder"
    required
    @selecting="onSecretSelected"
  />
</template>
