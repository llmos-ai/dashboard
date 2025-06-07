<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';

import { LLMOS } from '@shell/config/types';

import { allHash } from '@shell/utils/promise';
import { LICENSES, LANGUAGES, ML_FEATURES } from '@shell/utils/dictionary';

const S3 = 'S3';

export default {
  name: 'Dataset',

  components: {
    CruResource,
    NameNsDescription,
    Tab,
    LabeledSelect,
    LabeledInput,
    ResourceTabs,
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({ registries: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.REGISTRY }) });

    this.registries = hash.registries || [];
  },

  data() {
    const resource = { spec: { datasetCard: { metadata: { splitTypes: [] } } } };

    Object.assign(resource, this.value);

    return {
      errors:     [],
      registries: [],
      resource,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    this.registerAfterHook(this.afterSave, 'afterSave');
  },

  computed: {

    validationPassed() {
      return (
        !!this.value.metadata.name &&
        !!this.resource.spec.registry
      );
    },

    registryOptions() {
      const out = (this.registries || []).map((registry) => ({
        label: registry.id,
        value: registry.id,
      }));

      const defaultRegistry = this.registries.find((registry) => registry.isDefault) || {};

      if (defaultRegistry?.id) {
        out.unshift({
          label: this.t('modelRegistry.useDefault'),
          value: this.t('modelRegistry.useDefault'),
        });
      }

      return out;
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },
  },

  methods: {
    willSave() {
      Object.assign(this.value, this.resource);

      if (this.resource.spec.registry === this.t('modelRegistry.useDefault')) {
        const defaultRegistry = this.registries.find((registry) => registry.isDefault) || {};

        this.resource.spec.registry = defaultRegistry.id;
      }
    },
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    :validation-passed="validationPassed"
    @finish="save"
  >
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
      descriptionHidden
    />

    <ResourceTabs
      :value="value"
      class="mt-15"
      :need-conditions="true"
      :need-events="false"
      :need-related="false"
      :side-tabs="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        :label="t('generic.tabs.basic')"
        :weight="2"
      >
        <div class="row mb-10">
          <div class="col span-12">
            <LabeledSelect
              v-model:value="resource.spec.registry"
              :options="registryOptions"
              :mode="mode"
              :multiple="false"
              label-key="datasetCard.registry.label"
              required
            />
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
