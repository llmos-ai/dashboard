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

const S3 = 'S3';

export default {
  name: 'Dataset',

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
    backendTypes() {
      return [{
        label: this.t('modelRegistry.backendType.options.s3'),
        value: S3,
      }];
    },

    validationPassed() {
      return (
        !!this.value.metadata.name &&
        !!this.resource.spec.registry
      );
    },

    registryOptions() {
      return (this.registries || []).map((registry) => ({
        label: registry.metadata.name,
        value: registry.metadata.name,
      }));
    },

    licenseOptions() {
      return [{
        label: 'llama2',
        value: 'llama2',
      }];
    },

    splitTypeOptions() {
      return [{
        label: 'train',
        value: 'train',
      }, {
        label: 'test',
        value: 'test',
      }, {
        label: 'validation',
        value: 'validation',
      }];
    },

    featureOptions() {
      return [];
    },

    languageOptions() {
      return [{
        label: 'English',
        value: 'en',
      }];
    },

    authorOptions() {
      return [];
    },

    tagOptions() {
      return [];
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    versionSchema() {
      return this.$store.getters[`${ this.inStore }/schemaFor`](LLMOS.DATASET_VERSION);
    },
  },

  methods: {
    willSave() {
      Object.assign(this.value, this.resource);
    },

    async afterSave() {
      const errors = [];

      try {
        const url = this.versionSchema.linkFor('collection');

        const model = await this.$store.dispatch(`${ this.inStore }/create`, {
          metadata: {
            generateName: 'v1-',
            namespace:    this.value.metadata.namespace,
          },
          spec: {
            dataset:           this.value.metadata.name,
            version:           'v1.0.0',
            enableFastLoading: true
          },
        });

        await model.save({ url });
      } catch (e) {
        errors.push(e.message);
      }

      if (errors.length === 0) {
        return Promise.resolve();
      } else {
        return Promise.reject(errors);
      }
    }
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
              label-key="datasetCard.registry.label"
              required
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.splitTypes"
              :options="splitTypeOptions"
              :mode="mode"
              :multiple="true"
              label-key="datasetCard.splitTypes.label"
              :taggable="true"
              searchable
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.metadata.license"
              :options="licenseOptions"
              :mode="mode"
              :multiple="false"
              label-key="datasetCard.license.label"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.features"
              :options="featureOptions"
              :mode="mode"
              :multiple="true"
              label-key="datasetCard.features.label"
              :taggable="true"
              searchable
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.metadata.language"
              :options="languageOptions"
              :mode="mode"
              :multiple="false"
              label-key="datasetCard.language.label"
              :taggable="true"
              searchable
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.authors"
              :options="authorOptions"
              :mode="mode"
              :multiple="true"
              label-key="datasetCard.authors.label"
              :taggable="true"
              searchable
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="resource.spec.datasetCard.metadata.tags"
              :options="tagOptions"
              :mode="mode"
              :multiple="true"
              label-key="datasetCard.tags.label"
              :taggable="true"
              searchable
            />
          </div>
        </div>

        <div class="row mb-10 mt-10">
          <div class="col span-12">
            <LabeledInput
              v-model:value="resource.spec.datasetCard.description"
              :mode="mode"
              :label="t('datasetCard.description.label')"
              :placeholder="t('nameNsDescription.description.placeholder')"
              type="multiline"
            >
              <template #field>
                <a-textarea
                  v-model:value="resource.spec.datasetCard.description"
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
