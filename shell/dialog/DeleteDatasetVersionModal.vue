<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import Banner from '@shell/components/Banner/Banner.vue';
import { LLMOS } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { useI18n } from '@shell/composables/useI18n';

const props = defineProps({
  resources: {
    type:     Array,
    required: true,
  },

  onAdd: {
    type:    Function,
    default: () => {},
  },

  projectId: {
    type:    String,
    default: null,
  },

  saveInModal: {
    type:    Boolean,
    default: false,
  },

  beforeClose: {
    type:    Function,
    default: () => {},
  },

  saveCb: {
    type:    Function,
    default: () => {},
  },

  datasetId: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const store = useStore();
const { t } = useI18n(store);

const errors = ref([]);
const version = ref('');

const canSave = computed(() => {
  const out = !!version.value;

  return out;
});

const inStore = computed(() => {
  const inStore = store.getters['currentStore'](LLMOS.DATASET_VERSION);

  return inStore;
});

const dataset = computed(() => {
  const dataset = store.getters[`${ inStore.value }/byId`](LLMOS.DATASET, props.datasetId);

  return dataset || {};
});

const datasetVersions = computed(() => {
  return dataset.value.datasetVersions || [];
});

const datasetVersionOptions = computed(() => {
  return datasetVersions.value.map((version) => {
    const names = (version.metadata.name || '').split('-');

    return {
      label: names[0],
      value: version.spec.version,
    };
  });
});

const selectedVersion = computed(() => {
  return datasetVersions.value.find((d) => d.spec.version === version.value);
});

const close = () => {
  props.beforeClose();
  emit('close');
};

const save = async() => {
  errors.value = [];

  try {
    await selectedVersion.value.remove();

    message.success(t('deleteDatasetVersionModal.success'));

    emit('close');
  } catch (e) {
    errors.value.push(e.message);
  }
};
</script>

<template>
  <a-Card
    :title="t('deleteDatasetVersionModal.title')"
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

    <div
      class="row mb-10"
    >
      <div class="col span-12">
        <LabeledSelect
          v-model:value="version"
          :options="datasetVersionOptions"
          required
          :label="t('datasetCard.version.label')"
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
        danger
        :disabled="!canSave"
        @click="save"
      >
        {{ t('generic.confirm') }}
      </a-button>
    </template>
  </a-Card>
</template>

<style lang="scss" scoped>
.version-type-label,
.version-select-label {
  font-size: 14px;
  color: var(--text-label);
}

.version-type-group {
  width: 100%;
  display: flex;
  gap: 20px;
}

.version-type-option {
  flex: 1;
  display: flex;

  :deep(.ant-radio-wrapper) {
    width: 100%;
    height: 100%;
    margin-right: 0;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    display: flex;
    align-items: flex-start;

    &:hover, &.ant-radio-wrapper-checked {
      border-color: var(--primary);
    }

    :deep(.ant-radio) {
      margin-top: 2px;
    }
  }
}

.option-content {
  margin-left: 8px;
  flex: 1;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.version-select {
  width: 100%;
}
</style>
