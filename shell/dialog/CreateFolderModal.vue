<script>
import { message } from 'ant-design-vue';
import Banner from '@shell/components/Banner/Banner.vue';
import { LabeledInput } from '@shell/components/form/LabeledInput';

export default {
  name: 'CreateFolderModal',

  components: {
    Banner,
    LabeledInput
  },

  props: {
    resources: {
      type: Array,
      required: true,
    },

    beforeClose: {
      type: Function,
      default: () => {},
    },

    saveCb: {
      type: Function,
      default: () => {},
    },

    currentPath: {
      type: String,
      default: '',
    },
  },

  emits: ['close'],

  data() {
    return {
      errors: [],
      value: {
        targetDirectory: ''
      }
    };
  },

  computed: {
    canSave() {
      return !!this.value?.targetDirectory;
    },

    resource() {
      return this.resources[0] || {};
    }
  },

  methods: {
    close() {
      this.beforeClose();
      this.$emit('close');
    },

    async save() {
      this.errors = [];

      try {
        const res = await this.resource.doAction('createDirectory', { targetDirectory: `${this.currentPath}/${this.value.targetDirectory}` });

        if (res._status === 204) {
          message.success('Folder Created');
        }

        this.saveCb(res);
        this.$emit('close');
      } catch (e) {
        this.errors.push(e.message);
      }
    }
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
