<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import YamlEditor from '@shell/components/YamlEditor.vue';
import { allHash } from '@shell/utils/promise';
import { EVENT } from '@shell/config/types';
import Vue from 'vue';
import { _EDIT } from '@shell/config/query-params';
import { systemAddonLabel } from '@shell/models/management.llmos.ai.managedaddon';

export default {
  name:       'EditGenericAddon',
  components: {
    ResourceTabs,
    Tab,
    NameNsDescription,
    YamlEditor,
    Checkbox,
    LabeledInput,
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({ events: this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }) });
  },

  beforeDestroy() {
    this.$store.dispatch('cluster/forgetType', EVENT);
  },

  data() {
    const spec = this.value.spec;
    const metadata = this.value.metadata;
    const enabled = this.$route.query.enabled;

    if (!spec.valuesContent && spec.defaultValuesContent !== '') {
      Vue.set(spec, 'valuesContent', spec.defaultValuesContent);
    }

    if (enabled === 'true') {
      Vue.set(spec, 'enabled', true);
    }

    return { spec, metadata };
  },

  computed: {
    eventOverride() {
      if (this.isEdit) {
        return;
      }

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

    isEdit() {
      return this.mode === _EDIT;
    },

    allowEdit() {
      return this.isEdit && !this.isSystemAddon;
    },

    isSystemAddon() {
      return this.value.metadata?.annotations?.[systemAddonLabel] === 'true';
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  methods: {
    willSave() {
      this.errors = [];

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

      if (this.spec.valuesContent === this.spec.defaultValuesContent) {
        this.spec.valuesContent = null;
      }
    },

    validChartRepo(url) {
      const pattern = /^(http?|https?|git):\/\/.+$/;

      return pattern.test(url);
    },
  }
};
</script>

<template>
  <div>
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
      description-disabled
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
        :label="t('generic.tabs.basic')"
        class="bordered-table"
      >
        <h4>Enable Chart</h4>
        <div class="row mb-20">
          <Checkbox
            v-model="spec.enabled"
            label="Enabled"
            :mode="mode"
          />
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model="spec.repo"
              label="Chart Repo"
              required
              :disabled="allowEdit"
              :mode="mode"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="spec.chart"
              label="Chart Name"
              required
              :disabled="allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model="spec.version"
              label="Version"
              required
              :disabled="allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div>
          <h4>Values</h4>
          <div class="row mb-20">
            <div class="col span-12">
              <YamlEditor
                v-model="spec.valuesContent"
                :value="spec.valuesContent"
                :mode="mode"
                class="yaml-editor"
              />
            </div>
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>
