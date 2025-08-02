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

import { SECRET, AUTH_TYPE, DEFAULT_WORKSPACE } from '@shell/config/types';

const S3 = 'S3';

export default {
  name: 'ModelRegistry',

  components: {
    CruResource,
    NameNsDescription,
    Tab,
    LabeledSelect,
    LabeledInput,
    Checkbox,
    SelectOrCreateSecret,
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
    this.allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    const spec = {
      backendType: S3,
      s3Config:    {
        endpoint:                   this.value.spec?.s3Config?.endpoint || '',
        bucket:                     this.value.spec?.s3Config?.bucket || '',
        accessCredentialSecretName: this.value.spec?.s3Config?.accessCredentialSecretName || '',
        useSSL:                     this.value.spec?.s3Config?.useSSL ?? true,
      },
    };

    return {
      errors:     [],
      allSecrets: [],
      resource:   { spec },
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
        !!this.value.metadata.name &&
        !!this.resource.spec.backendType &&
        !!this.resource.spec.s3Config.endpoint &&
        !!this.resource.spec.s3Config.bucket &&
        !!this.resource.spec.s3Config.accessCredentialSecretName
      );
    },

    accessCredentialSecretNameOptions() {
      if (!this.allSecrets) {
        return [];
      }

      const map = groupBy(this.allSecrets, 'metadata.namespace');

      const out = Object.keys(map).reduce((out, namespace) => {
        if (namespace === DEFAULT_WORKSPACE) {
          const groupOption = {
            kind:  'group',
            label: `${ this.t('nameNsDescription.namespace.label') }: ${ namespace }`,
          };

          return [
            ...out,
            groupOption,
            ...map[namespace].filter((secret) => secret.metadata.namespace === DEFAULT_WORKSPACE).map((secret) => ({
              label: secret.metadata.name,
              value: secret.metadata.name,
            })),
          ];
        } else {
          return out;
        }
      }, [{
        label: this.t('modelRegistry.selectOrCreateSecret'),
        value: AUTH_TYPE._S3,
        kind:  'highlighted',
      }]);

      return out;
    }
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
    :bannerErrors="errors"
    :apply-hooks="applyHooks"
    :validation-passed="validationPassed"
    @finish="save"
    @error="e=>errors = e"
  >
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
    />

    <div
      class="row"
    >
      <div class="col span-12">
        <LabeledSelect
          v-model:value="resource.spec.backendType"
          :options="backendTypes"
          :mode="mode"
          :multiple="false"
          label-key="modelRegistry.backendType.label"
          required
        />
      </div>
    </div>

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
        name="config"
        :label="t('modelRegistry.tabs.config.label')"
        :weight="2"
      >
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput
              v-model:value="resource.spec.s3Config.endpoint"
              :mode="mode"
              :label="t('modelRegistry.endpoint.label')"
              :placeholder="t('modelRegistry.endpoint.placeholder')"
              required
            />
            <Checkbox
              v-model:value="resource.spec.s3Config.useSSL"
              class="mt-10"
              :mode="mode"
              :label="t('modelRegistry.useSSL.label')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model:value="resource.spec.s3Config.bucket"
              :mode="mode"
              :label="t('modelRegistry.bucket.label')"
              :placeholder="t('modelRegistry.bucket.placeholder')"
              required
            />
          </div>
        </div>

        <div
          class="row mb-10"
        >
          <div class="col span-6">
            <SelectOrCreateSecret
              v-model:value="resource.spec.s3Config.accessCredentialSecretName"
              :options="accessCredentialSecretNameOptions"
              :mode="mode"
              label-key="modelRegistry.accessCredentialSecretName.label"
              :placeholder="t('modelRegistry.accessCredentialSecretName.placeholder')"
              required
            />
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
