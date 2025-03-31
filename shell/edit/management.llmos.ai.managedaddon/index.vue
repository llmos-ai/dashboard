<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import FormValidation from '@shell/mixins/form-validation';

export default {
  name:       'EditManagedAddon',
  components: { CruResource },
  mixins:     [CreateEditView, FormValidation],
  props:      {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    currentComponent() {
      const name = this.value.metadata.name;

      try {
        return require(`./${ name }/index.vue`).default;
      } catch {
        return require(`./generic.vue`).default;
      }
    },
  },

  methods: {
    async saveAddon(done) {
      if (!this.value.spec.enabled) {
        const shouldContinue = await this.showDisablePrompt();

        if (!shouldContinue) {
          return done('cancelled');
        }
      }
      this.save(done);
    },

    showDisablePrompt() {
      let promptMsg;
      const name = this.value.metadata.name;
      const exists = this.$store.getters['i18n/exists'];
      const key = `managedAddon.disablePrompt.${ name }`;
      const defaultKey = 'managedAddon.disablePrompt.generic';

      if (exists(key)) {
        promptMsg = this.t(key, { name }, true);
      } else if (exists(defaultKey)) {
        promptMsg = this.t(defaultKey, { name }, true);
      }

      return new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component:      'GenericPrompt',
          componentProps: {
            applyMode: 'disable',
            title:     this.t('promptRemove.title', {}, true),
            body:      promptMsg,
            confirm:   (buttonDone) => {
              if (buttonDone) {
                resolve(true);
              }
              resolve(false);
            },
          },
        });
      });
    },
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="saveAddon"
  >
    <component
      :is="currentComponent"
      :value="value"
      :register-before-hook="registerBeforeHook"
      :mode="mode"
    />
  </CruResource>
</template>
