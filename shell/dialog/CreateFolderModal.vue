<script setup>
import { ref, defineProps, computed, reactive, defineEmits } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import Banner from '@shell/components/Banner/Banner.vue';
import { SECRET } from '@shell/config/types';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { SECRET_TYPES } from '@shell/config/secret';
import { DEFAULT_WORKSPACE } from '@shell/config/types';

import { base64Encode } from '@shell/utils/crypto';

const store = useStore();

const props = defineProps({
  resources: {
    type:     Array,
    required: true,
  },

  beforeClose: {
    type:    Function,
    default: () => {},
  },

  saveCb: {
    type:    Function,
    default: () => {},
  },

  currentPath: {
    type:    String,
    default: '',
  },
});

const errors = ref([]);

const value = reactive({
  targetDirectory: '',
});

const emit = defineEmits(['close']);

const canSave = computed(() => {
  const out = (
    !!value?.targetDirectory
  );

  return out;
});

const resource = computed(() => {
  return props.resources[0] || {}
})

const close = () => {
  props.beforeClose();
  emit('close');
};

const save = async() => {
  errors.value = [];

  try {
    const res = await resource.value.doAction('createDirectory', {
      targetDirectory: `${ props.currentPath }/${ value.targetDirectory}`
    })

    if (res._status === 204) {
      message.success('Folder Created');
    }

    props.saveCb(res);

    emit('close');
  } catch (e) {
    errors.value.push(e.message);
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
  <a-Card
    :title="t('createFolderModal.title')"
    :show-highlight-border="false"
    :sticky="true"
  >
    <div class="pl-10 pr-10">
      <Banner
        v-if="errors.length > 0"
        color="error"
      >
        {{ errors }}
      </Banner>
    </div>

    <div class="row mb-10">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.targetDirectory"
          :label="t('createFolderModal.targetDirectory.label')"
          :placeholder="t('createFolderModal.targetDirectory.placeholder')"
          :required="true"
        />
      </div>
    </div>

    <template #actions>
      <a-button
        @click="close"
      >
        {{ t('generic.cancel') }}
      </a-button>

      <a-button
        type="primary"
        :disabled="!canSave"
        @click="save"
      >
        {{ t('generic.create') }}
      </a-button>
    </template>
  </a-Card>
</template>
