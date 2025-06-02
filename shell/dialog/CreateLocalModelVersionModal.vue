<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { message } from 'ant-design-vue';
import Banner from '@shell/components/Banner/Banner.vue';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { LLMOS, DEFAULT_WORKSPACE } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'CreateLocalModelVersionModal',

  components: {
    Banner,
    LabeledInput,
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

    modelId: {
      type:    String,
      default: '',
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const store = useStore();

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
      return !!value.metadata.name;
    });

    const inStore = computed(() => {
      return store.getters['currentStore'](value.type);
    });

    const model = computed(() => {
      const model = store.getters[`${ inStore.value }/byId`](LLMOS.MODEL, props.modelId);

      return model || {};
    });

    const localModel = computed(() => {
      const localModel = store.getters[`${ inStore.value }/byId`](LLMOS.LOCAL_MODEL, `${ model.value.id }-local`);

      return localModel || {};
    });

    onMounted(async() => {
      await allHash({ localModels: await store.dispatch(`${ inStore.value }/findAll`, { type: LLMOS.LOCAL_MODEL }) });
    });

    const close = () => {
      props.beforeClose();
      emit('close');
    };

    const createLocalModel = async() => {
      const name = model.value.metadata?.name;

      if (!localModel.value.id) {
        const resource = await store.dispatch(`${ inStore.value }/create`, {
          type:     LLMOS.LOCAL_MODEL,
          metadata: {
            name,
            namespace: model.value.metadata?.namespace,
          },
          spec: {
            registry:  model.value.spec?.registry,
            modelName: `${ model.value.id }`
          },
        });

        return await resource.save();
      } else {
        return localModel.value;
      }
    };

    const save = async() => {
      errors.value = [];

      try {
        const newLocalModel = await createLocalModel();
        const localModelName = newLocalModel?.metadata?.name;

        const localModelVersion = await store.dispatch(`${ inStore.value }/create`, {
          type:     LLMOS.LOCAL_MODEL_VERSION,
          metadata: {
            name:      `${ localModelName }-${ value.metadata.name }`,
            namespace: model.value.metadata?.namespace,
          },
          spec: { localModel: localModelName },
        });

        await localModelVersion.save();

        const patchData = { spec: { defaultVersion: localModelVersion?.id } };

        newLocalModel.patch(patchData, { headers: { 'content-type': 'application/merge-patch+json' } }, true, true);

        emit('close');
      } catch (err) {
        message.error(`Cache Fail: ${ err.message || err }`);
      }
    };

    return {
      errors,
      value,
      canSave,
      close,
      save
    };
  }
};
</script>

<template>
  <a-Card
    :title="t('createLocalModelVersionModal.title')"
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
          v-model:value="value.metadata.name"
          :label="t('createLocalModelVersionModal.name.label')"
          :placeholder="t('createLocalModelVersionModal.name.placeholder')"
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
