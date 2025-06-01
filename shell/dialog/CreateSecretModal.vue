<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import Banner from '@shell/components/Banner/Banner.vue';
import { SECRET, DEFAULT_WORKSPACE } from '@shell/config/types';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { SECRET_TYPES } from '@shell/config/secret';
import { base64Encode } from '@shell/utils/crypto';

export default {
  name: 'CreateSecretModal',

  components: {
    Banner,
    LabeledInput,
    NameNsDescription
  },

  props: {
    resources: {
      type: Array,
      required: true,
    },

    onAdd: {
      type: Function,
      default: () => {},
    },

    projectId: {
      type: String,
      default: null,
    },

    saveInModal: {
      type: Boolean,
      default: false,
    },

    beforeClose: {
      type: Function,
      default: () => {},
    },

    saveCb: {
      type: Function,
      default: () => {},
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const store = useStore();

    const errors = ref([]);

    const value = reactive({
      metadata: {
        name: '',
        namespace: DEFAULT_WORKSPACE,
      },
      type: SECRET_TYPES.OPAQUE,
      data: {
        accessKeyID: '',
        accessKeySecret: ''
      },
    });

    const canSave = computed(() => {
      const out = (
        !!value?.metadata?.name &&
        !!value?.metadata?.namespace &&
        !!value?.data?.accessKeyID &&
        !!value?.data?.accessKeySecret
      );

      return out;
    });

    const inStore = computed(() => {
      return store.getters['currentStore'](value.type);
    });

    const schema = computed(() => {
      return store.getters[`${inStore.value}/schemaFor`](SECRET);
    });

    const close = () => {
      props.beforeClose();
      emit('close');
    };

    const save = async() => {
      errors.value = [];

      try {
        const url = schema.value.linkFor('collection');

        const model = await store.dispatch(`${inStore.value}/create`, {
          ...value,
          data: {
            ...value.data,
            accessKeyID: base64Encode(value.data.accessKeyID),
            accessKeySecret: base64Encode(value.data.accessKeySecret),
          },
        });

        Object.assign(model, {
          type: SECRET_TYPES.OPAQUE,
          _type: SECRET_TYPES.OPAQUE,
        });

        const res = await model.save({ url });

        props.saveCb(res);

        emit('close');
      } catch (e) {
        errors.value.push(e.message);
      }
    };

    return {
      t,
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
    :title="t('createSecretModal.title')"
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

    <NameNsDescription
      :value="value"
      :namespaced="false"
      mode="create"
    />

    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.data.accessKeyID"
          :label="t('createSecretModal.accessKeyID.label')"
          :placeholder="t('createSecretModal.accessKeyID.placeholder')"
          :required="true"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.data.accessKeySecret"
          :label="t('createSecretModal.accessKeySecret.label')"
          :placeholder="t('createSecretModal.accessKeySecret.placeholder')"
          :required="true"
          type="password"
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
