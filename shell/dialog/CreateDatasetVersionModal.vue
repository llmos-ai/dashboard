<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';

import Banner from '@shell/components/Banner/Banner.vue';
import { LLMOS, DEFAULT_WORKSPACE } from '@shell/config/types';
import LabelValue from '@shell/components/LabelValue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { useI18n } from '@shell/composables/useI18n';

export default {
  name: 'CreateDatasetVersionModal',

  components: {
    Banner,
    LabelValue,
    LabeledSelect
  },

  props: {
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
  },

  emits: ['close'],

  setup(props, { emit }) {
    const store = useStore();
    const { t } = useI18n(store);

    const errors = ref([]);

    const value = reactive({
      metadata: {
        name:      '',
        namespace: DEFAULT_WORKSPACE,
      },
      spec: {
        dataset:           props.datasetId,
        version:           '',
        enableFastLoading: true
      },
    });

    const canSave = computed(() => {
      const out = value.spec.enableFastLoading ? !!value?.spec?.version : true;

      return out;
    });

    const inStore = computed(() => {
      const inStore = store.getters['currentStore'](value.type);

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

    const latestDatasetVersion = computed(() => {
      return datasetVersions.value?.[0] || {};
    });

    const latestVersion = computed(() => {
      const versionStr = latestDatasetVersion.value?.metadata?.name || '';
      const match = versionStr.match(/^v(\d+)/);
      const currentMax = match ? parseInt(match[1]) : 0;

      return `v${ currentMax + 1 }`;
    });

    const schema = computed(() => {
      return store.getters[`${ inStore.value }/schemaFor`](LLMOS.DATASET_VERSION);
    });

    value.spec.version = datasetVersions.value?.[0]?.spec.version;

    const close = () => {
      props.beforeClose();
      emit('close');
    };

    const save = async() => {
      errors.value = [];

      try {
        const url = schema.value.linkFor('collection');

        const model = await store.dispatch(`${ inStore.value }/create`, {
          metadata: {
            generateName: `${ latestVersion.value }-`,
            namespace:    latestDatasetVersion.value.metadata.namespace,
          },
          spec: {
            dataset:           latestDatasetVersion.value.spec.dataset,
            version:           `${ latestVersion.value }.0.0`,
            enableFastLoading: value.spec.enableFastLoading,
            copyFrom:          {
              namespace: latestDatasetVersion.value.metadata.namespace,
              dataset:   latestDatasetVersion.value.spec.dataset,
              version:   value.spec.version,
            },
          },
        });

        await model.save({ url });

        message.success(t('createDatasetVersionModal.success'));

        emit('close');
      } catch (e) {
        errors.value.push(e.message);
      }
    };

    return {
      errors,
      value,
      canSave,
      dataset,
      datasetVersions,
      datasetVersionOptions,
      latestVersion,
      t,
      close,
      save
    };
  }
};
</script>

<template>
  <a-Card
    :title="t('createDatasetVersionModal.title')"
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
        <LabelValue
          v-model:value="latestVersion"
          :name="t('createDatasetVersionModal.versionName.label')"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-12">
        <div class="version-type-label mb-5">
          {{ t('createDatasetVersionModal.inheritance.label') }}
        </div>
        <a-radio-group
          v-model:value="value.spec.enableFastLoading"
          class="version-type-group"
        >
          <div class="version-type-option">
            <a-radio :value="true">
              <div class="option-content">
                <div class="option-title">
                  {{ t('createDatasetVersionModal.inheritance.inherit.title') }}
                </div>
                <div class="option-desc">
                  {{ t('createDatasetVersionModal.inheritance.inherit.desc') }}
                </div>
              </div>
            </a-radio>
          </div>
          <div class="version-type-option">
            <a-radio :value="false">
              <div class="option-content">
                <div class="option-title">
                  {{ t('createDatasetVersionModal.inheritance.new.title') }}
                </div>
                <div class="option-desc">
                  {{ t('createDatasetVersionModal.inheritance.new.desc') }}
                </div>
              </div>
            </a-radio>
          </div>
        </a-radio-group>
      </div>
    </div>

    <div
      v-if="value.spec.enableFastLoading"
      class="row mb-10"
    >
      <div class="col span-12">
        <LabeledSelect
          v-model:value="value.spec.version"
          :options="datasetVersionOptions"
          required
          :label="t('createDatasetVersionModal.version.label')"
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
