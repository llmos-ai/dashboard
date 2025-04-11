<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import LabeledInput from '@shell/components/form/LabeledInput/LabeledInput.vue';
import { set } from '@shell/utils/object';
import { Banner } from '@shell/components/Banner';
import CephConfig from '@shell/mixins/ceph-config';

export const REPLICATED = 'Replicated';
export const ERASURE_CODED = 'Erasure Coded';

export default {
  name:       'CephBlockPool',
  components: {
    LabeledInput,
    UnitInput,
    LabeledSelect,
    ResourceTabs,
    Tab,
    CruResource,
    NameNsDescription,
    KeyValue,
    Banner,
  },
  mixins: [CreateEditView, FormValidation, CephConfig],
  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:        String,
      default:     'create',
      typeOptions: [REPLICATED, ERASURE_CODED],
    },
  },
  data() {
    const spec = this.value.spec;
    let type = this.status?.info?.type;

    if (!type) {
      type = spec.replicated?.size !== 0 ? 'Replicated' : 'Erasure Coded';
    }

    return {
      spec,
      type,
      REPLICATED,
      ERASURE_CODED,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {},

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.type === ERASURE_CODED) {
        set(this, 'spec.replicated', null);
      } else {
        set(this, 'spec.erasureCoded', null);
      }
    },

    update() {
      if (this.type === ERASURE_CODED && !this.spec.erasureCoded) {
        this.spec.erasureCoded = {
          dataChunks:   2,
          codingChunks: 1
        };
      }
    },

    span(text) {
      return `<span> ${ text } </span>`;
    }
  }
};
</script>

<template>
  <div>
    <div>
      <Banner
        v-if="isLLMOSRelease"
        color="info"
        class="mb-20"
        :inner-html="managedWarning"
      />
    </div>
    <form class="filled-height">
      <CruResource
        :done-route="doneRoute"
        :mode="mode"
        :resource="value"
        :validation-passed="fvFormIsValid"
        :errors="fvUnreportedValidationErrors"
        :apply-hooks="applyHooks"
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
          :need-conditions="false"
          :need-related="false"
          :side-tabs="true"
          :mode="mode"
        >
          <Tab
            name="basic"
            label="Pool Settings"
            class="bordered-table"
          >
            <div class="row">
              <div class="col span-6 mb-10">
                <LabeledSelect
                  v-model:value="spec.failureDomain"
                  label="Failure Domain"
                  :options="['host', 'osd']"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>

              <div class="col span-6 mb-10">
                <LabeledInput
                  v-model:value="spec.deviceClass"
                  label="Device Class"
                  :mode="mode"
                  @update:value="update"
                />
              </div>
            </div>

            <!-- Replicated configs -->
            <div class="row">
              <div class="col span-6 mb-10">
                <LabeledSelect
                  v-model:value="type"
                  label="Type"
                  :options="['Replicated', 'Erasure Coded']"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>

              <div
                v-if="type === REPLICATED"
                class="col span-6 mb-10"
              >
                <UnitInput
                  v-model:value="spec.replicated.size"
                  :hide-unit="true"
                  label="Replicas Per Failure Domain"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>
            </div>

            <div
              v-if="type === ERASURE_CODED"
              class="row"
            >
              <div class="col span-6 mb-10">
                <UnitInput
                  v-model:value="spec.erasureCoded.dataChunks"
                  :hide-unit="true"
                  label="Data Chunks"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>
              <div class="col span-6 mb-10">
                <UnitInput
                  v-model:value="spec.erasureCoded.codingChunks"
                  :hide-unit="true"
                  label="Coding Chunks"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>
            </div>

            <br>
            <h3>Parameters</h3>
            <KeyValue
              v-model:value="spec.parameters"
              :add-label="t('storage.addParameters')"
              :read-allowed="false"
              :mode="mode"
            />
          </Tab>
        </ResourceTabs>
      </CruResource>
    </form>
  </div>
</template>
