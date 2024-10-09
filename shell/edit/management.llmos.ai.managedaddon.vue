<script>
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import YamlEditor from '@shell/components/YamlEditor.vue';
import FormValidation from '@shell/mixins/form-validation';
import { allHash } from '@shell/utils/promise';
import { EVENT } from '@shell/config/types';
import Loading from '@shell/components/Loading.vue';

export default {
  components: {
    Loading,
    YamlEditor,
    Checkbox,
    ResourceTabs,
    Tab,
    NameNsDescription,
    CruResource,
    LabeledInput,
  },
  mixins: [CreateEditView, FormValidation],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({ events: this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }) });
  },

  data() {
    const spec = this.value.spec;
    const metadata = this.value.metadata;

    return { spec, metadata };
  },

  computed: {
    eventOverride() {
      const events = this.$store.getters[`cluster/all`](EVENT);

      return events.filter((event) => {
        if (event.involvedObject?.uid === this.value?.metadata?.uid) {
          return true;
        }

        if (event.involvedObject?.name.includes(`helm-install-${ this.value.metadata?.name }`)) {
          return true;
        }

        return false;
      }).map((event) => {
        return {
          reason:    (`${ event.reason || this.t('generic.unknown') }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message:   event.message || this.t('generic.unknown'),
          date:      event.lastTimestamp || event.firstTimestamp || event.metadata.creationTimestamp,
          eventType: event.eventType
        };
      });
    },

    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.spec.chart === '') {
        this.errors.push(this.t('validation.required', { key: 'Chart Name' }, true));
      }

      if (this.spec.version === '') {
        this.errors.push(this.t('validation.required', { key: 'Version' }, true));
      }

      if (this.spec.repo === '' ) {
        this.errors.push(this.t('validation.required', { key: 'Repo' }, true));
      }

      if (!this.validChartRepo(this.spec.repo)) {
        this.errors.push(this.t('validation.invalidChartRepo', { key: 'Repo' }, true));
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }
    },

    validChartRepo(url) {
      const pattern = /^(http?|https?|git):\/\/.+$/;

      return pattern.test(url);
    },

    update() {},
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form
    v-else
    class="filled-height"
  >
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
        v-model="value"
        class="mt-15"
        :need-conditions="false"
        :need-related="false"
        :side-tabs="true"
        :eventOverride="eventOverride"
        :useOverrideEvents="true"
        :mode="mode"
      >
        <Tab
          name="basic"
          :label="t('cluster.tabs.basic')"
          class="bordered-table"
        >
          <h4>Enable Chart</h4>
          <div class="row mb-20">
            <Checkbox
              v-model="spec.enabled"
              label="Enabled"
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <labeledInput
                v-model="spec.repo"
                label="Chart Repo"
                required
                :mode="mode"
                @input="update"
              />
            </div>

            <div class="col span-6">
              <LabeledInput
                v-model="spec.chart"
                label="Chart Name"
                required
                :mode="mode"
                @input="update"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <labeledInput
                v-model="spec.version"
                label="Version"
                required
                :mode="mode"
                @input="update"
              />
            </div>
          </div>

          <h4>Values</h4>
          <div class="row mb-20">
            <div class="col span-12">
              <YamlEditor
                v-model="spec.valuesContent"
                :value="spec.valuesContent"
                :mode="mode"
                class="yaml-editor"
                @input="update"
              />
            </div>
          </div>
        </Tab>
      </ResourceTabs>
    </CruResource>
  </form>
</template>
