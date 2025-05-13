<script>
import { groupBy } from 'lodash';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { Checkbox } from '@shell/components/form/Checkbox';
import Tab from '@shell/components/Tabbed/Tab';
import SelectOrCreateSecret from '@shell/components/SelectOrCreateSecret';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import LabeledTag from '@shell/components/form/LabeledTag';

import { SECRET, AUTH_TYPE, LLMOS } from '@shell/config/types';

import { allHash } from '@shell/utils/promise';
import { LICENSES, LANGUAGES } from '@shell/utils/dictionary'
import { allModelName as MODELS } from '@shell/utils/ai-model'

const S3 = 'S3';

export default {
  name: 'Model',

  components: {
    CruResource,
    NameNsDescription,
    Tab,
    LabeledSelect,
    LabeledInput,
    Checkbox,
    SelectOrCreateSecret,
    ResourceTabs,
    LabeledTag,
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

    const hash = await allHash({
      registries: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.REGISTRY }),
      datasets:  this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET }),
    });

    this.registries = hash.registries || [];
    this.datasets = hash.datasets || [];
  },

  data() {
    const resource = {
      spec: {
        modelCard:    {
          metadata: {
            datasets:  [],
          },
        },
      }
    };

    Object.assign(resource, this.value);

    return {
      errors:     [],
      registries: [],
      datasets: [],
      resource,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    backendTypes() {
      return [{
        label: this.t('modelRegistry.backendType.options.s3'),
        value: S3,
      }];
    },

    validationPassed() {
      return (
        !!this.value.metadata.name
        && !!this.resource.spec.registry
        && !!this.resource.spec.modelCard.description
      );
    },

    registryOptions() {
      return (this.registries || []).map((registry) => ({
        label: registry.metadata.name,
        value: registry.metadata.name,
      }));
    },

    licenseOptions() {
      return LICENSES
    },

    baseModelOptions() {
      return MODELS.map((model) => ({
        label: model,
        value: model,
      }));
    },

    languageOptions() {
      return LANGUAGES
    },

    frameworkOptions() {
      return [{
        label: 'Pytorch',
        value: 'pytorch',
      }]
    },

    datasetOptions() {
      return this.datasets.map((dataset) => ({
        label: dataset.metadata.name,
        value: dataset.id,
      }));
    },

    tagOptions() {
      return []
    },
  },

  methods: {
    willSave() {
      Object.assign(this.value, this.resource);
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
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.registry"
              :options="registryOptions"
              :mode="mode"
              :multiple="false"
              label-key="modelCard.registry.label"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.baseModel"
              :options="baseModelOptions"
              :mode="mode"
              :multiple="false"
              label-key="modelCard.baseModel.label"
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.license"
              :options="licenseOptions"
              :mode="mode"
              :multiple="false"
              label-key="modelCard.license.label"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.datasets"
              :options="datasetOptions"
              :mode="mode"
              :multiple="true"
              label-key="modelCard.datasets.label"
            />
          </div>
        </div>
        
        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.language"
              :options="languageOptions"
              :mode="mode"
              :multiple="false"
              label-key="modelCard.language.label"
              :taggable="true"
              searchable
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.framework"
              :options="frameworkOptions"
              :mode="mode"
              :multiple="false"
              label-key="modelCard.framework.label"
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.modelCard.metadata.tags"
              :options="tagOptions"
              :mode="mode"
              :multiple="true"
              label-key="modelCard.tags.label"
              :taggable="true"
              searchable
            />
          </div>
        </div>

        <div class="row mt-10 mb-10">
          <div class="col span-6">
            <div class="label">
              <div class="text-label">
                <t k="modelCard.requiredResources.label" />
              </div>
            </div>
            <div class="mt-10">
              <a-checkbox
                v-model:checked="resource.spec.modelCard.metadata.cpu"
                type="checkbox"
              />
              {{ t('modelCard.cpu.label') }}
              <a-checkbox
                v-model:checked="resource.spec.modelCard.metadata.gpu"
                type="checkbox"
                class="ml-10"
              />
              {{ t('modelCard.gpu.label') }}
            </div>
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-12">
            <LabeledInput
              v-model:value="resource.spec.modelCard.description"
              :mode="mode"
              :label="t('modelCard.description.label')"
              :placeholder="t('nameNsDescription.description.placeholder')"
              required
              type="multiline"
            >
              <template #field>
                <a-textarea
                  v-model:value="resource.spec.modelCard.description"
                  :rows="10"
                />
              </template>
            </LabeledInput>
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
