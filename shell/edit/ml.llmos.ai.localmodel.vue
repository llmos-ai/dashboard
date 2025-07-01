<script>
import { groupBy } from 'lodash';
import { message } from 'ant-design-vue';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';

import { LLMOS } from '@shell/config/types';

import { allHash } from '@shell/utils/promise';
import { set } from '@shell/utils/object';

export default {
  name: 'Dataset',

  components: {
    CruResource,
    Tab,
    LabeledSelect,
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

    const hash = await allHash({
      models:             this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.MODEL }),
      localModels:        this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.LOCAL_MODEL }),
      localModelVersions: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.LOCAL_MODEL_VERSION }),
    });

    set(this, 'models', hash.models || []);
  },

  data() {
    const resource = { spec: { } };

    Object.assign(resource, this.value);

    return {
      errors: [],
      models: [],
      resource,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
    this.registerAfterHook(this.afterSave, 'afterSave');
  },

  computed: {
    modelOptions() {
      if (!this.models) {
        return [];
      }

      const map = groupBy(this.models, 'metadata.namespace');

      const out = Object.keys(map).reduce((out, namespace) => {
        const groupOption = {
          kind:  'group',
          label: `${ this.t('nameNsDescription.namespace.label') }: ${ namespace }`,
        };

        return [
          ...out,
          groupOption,
          ...map[namespace].map((model) => ({
            label: model.metadata.name,
            value: model.id,
          })),
        ];
      }, []);

      return out;
    },

    selectedModel() {
      return this.models.find((model) => model.id === this.resource.spec.modelName);
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    hasLocalModel() {
      const localModel = this.$store.getters[`${ this.inStore }/byId`](LLMOS.LOCAL_MODEL, this.resource.spec.modelName) || {};

      return !!localModel.id;
    },
  },

  methods: {
    async willSave() {
      const model = this.selectedModel;
      const name = model.metadata?.name;

      Object.assign(this.value, {
        metadata: {
          name,
          namespace: model?.metadata?.namespace,
        },
        spec: {
          registry:  model?.spec?.registry,
          modelName: this.resource.spec.modelName,
        },
      });
    },

    async afterSave() {
      const errors = [];

      try {
        const newLocalModel = this.value;
        const localModelName = newLocalModel?.metadata?.name;

        const localModelVersion = await this.$store.dispatch(`${ this.inStore }/create`, {
          type:     LLMOS.LOCAL_MODEL_VERSION,
          metadata: {
            name:      `${ localModelName }-${ newLocalModel.nextVersion }`,
            namespace: newLocalModel.metadata?.namespace,
          },
          spec: { localModel: localModelName },
        });

        await localModelVersion.save();

        message.success(`Local Model ${ localModelName } Version ${ newLocalModel.nextVersion } created successfully`);
      } catch (e) {
        errors.push(e.message);
      }

      if (errors.length === 0) {
        return Promise.resolve();
      } else {
        return Promise.reject(errors);
      }
    },

    async actuallySave(url) {
      if ( this.isCreate ) {
        if (this.hasLocalModel) {
          return Promise.resolve();
        }

        url = url || this.schema.linkFor('collection');
        const res = await this.value.save({ url });

        if (res) {
          Object.assign(this.value, res);
        }
      } else {
        await this.value.save();
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
    :bannerErrors="errors"
    :apply-hooks="applyHooks"
    :validation-passed="validationPassed"
    @finish="save"
    @error="e=>errors = e"
  >
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
              v-model:value="resource.spec.modelName"
              :options="modelOptions"
              :mode="mode"
              :multiple="false"
              label-key="localModel.modelName.label"
              required
            />
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
