<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { allHash } from '@shell/utils/promise';
import { MANAGEMENT, PVC, STORAGE_CLASS } from '@shell/config/types';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import Prometheus from '@shell/edit/management.llmos.ai.managedaddon/llmos-monitoring/prometheus/index';
import Grafana from '@shell/edit/management.llmos.ai.managedaddon/llmos-monitoring/grafana/index';
import Alerting from '@shell/edit/management.llmos.ai.managedaddon/llmos-monitoring/alerting/index';
import ManagedAddonMixin from '@shell/edit/management.llmos.ai.managedaddon/mixin/addon';
import { SETTING } from '@shell/config/settings';

const weights = {
  basic:      5,
  prometheus: 4,
  grafana:    3,
  alerting:   2,
};

export default {
  name:       'EditMonitoringAddon',
  mixins:     [ManagedAddonMixin],
  components: {
    ResourceTabs,
    Tab,
    NameNsDescription,
    Checkbox,
    LabeledInput,
    Prometheus,
    Grafana,
    Alerting,
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

    // Fetch all the resources required for all the tabs asyncronously up front
    const hashPromises = {
      pvcs:           this.$store.dispatch(`${ inStore }/findAll`, { type: PVC }),
      storageClasses: this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }),
      serverUrl:      this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: SETTING.SERVER_URL }),
    };
    const hash = await allHash(hashPromises);

    this.storageClasses = hash.storageClasses;
    this.pvcs = hash.pvcs;
    this.valuesContent.global.llmos.url = hash.serverUrl?.value;
  },

  data() {
    const spec = this.value.spec;
    const metadata = this.value.metadata;
    const enabled = this.$route.query.enabled;

    if (enabled !== undefined) {
      spec.enabled = enabled.toString() === 'true';
    }

    const defaultValuesContent = jsyaml.load(spec.defaultValuesContent);

    let valuesContent;

    try {
      // If valuesContent is empty, use defaultValuesContent
      if (spec.valuesContent && spec.valuesContent.length > 0) {
        valuesContent = jsyaml.load(spec.valuesContent);
      }

      valuesContent = merge({}, defaultValuesContent, valuesContent);
    } catch (err) {
      this.$store.dispatch('growl/fromError', {
        title: this.$store.getters['i18n/t']('generic.notification.title.error'),
        err:   err.data || err,
      }, { root: true });
    }

    return {
      spec,
      metadata,
      valuesContent,
      defaultValuesContent,
      disableAggregateRoles: false,
      pvcs:                  [],
      storageClasses:        [],
      weights,
      serverUrl:             '',
      accessModes:           [
        {
          id:    'ReadWriteOnce',
          label: 'monitoring.accessModes.once',
        },
        {
          id:    'ReadOnlyMany',
          label: 'monitoring.accessModes.readOnlyMany',
        },
        {
          id:    'ReadWriteMany',
          label: 'monitoring.accessModes.many',
        },
      ],
    };
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

      if (this.spec.repo === '') {
        this.errors.push(this.t('validation.required', { key: 'Repo' }, true));
      }

      if (!this.validChartRepo(this.spec.repo)) {
        this.errors.push(this.t('validation.invalidChartRepo', { key: 'Repo' }, true));
      }

      try {
        this.spec.valuesContent = jsyaml.dump(this.valuesContent);
      } catch (err) {
        this.$store.dispatch('growl/fromError', {
          title: this.$store.getters['i18n/t']('generic.notification.title.error'),
          err:   err.data || err,
        }, { root: true });
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      } else {
        return Promise.resolve();
      }
    },
  },
  watch: {
    valuesContent: {
      handler(val) {
        this.spec.valuesContent = jsyaml.dump(val);
      },
      deep: true
    }
  }
};
</script>

<template>
  <div>
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
      :description-disabled="!allowEdit"
    />

    <ResourceTabs
      v-model:value="value"
      class="mt-15"
      :need-conditions="false"
      :need-related="false"
      :side-tabs="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        :label="t('generic.tabs.basic')"
        class="bordered-table"
        :weight="weights.basic"
      >
        <h4>Enable Chart</h4>
        <div class="row mb-20">
          <Checkbox
            v-model:value="spec.enabled"
            label="Enabled"
            :mode="mode"
          />
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model:value="spec.repo"
              label="Chart Repo"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model:value="spec.chart"
              label="Chart Name"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model:value="spec.version"
              label="Version"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div>
          <h4>{{ t('generic.tabs.general') }}</h4>
          <div class="row mb-20">
            <div class="col span-6">
              <Checkbox
                v-model:value="valuesContent.global.rbac.userRoles.create"
                label-key="monitoring.createDefaultRoles.label"
                :tooltip="t('monitoring.createDefaultRoles.tip', {}, true)"
              />
            </div>
            <div class="col span-6">
              <Checkbox
                v-model:value="valuesContent.global.rbac.userRoles.aggregateToDefaultRoles"
                label-key="monitoring.aggregateDefaultRoles.label"
                :tooltip="{
                  content: t('monitoring.aggregateDefaultRoles.tip', {}, true),
                  autoHide: false,
                }"
                :disabled="disableAggregateRoles"
              />
            </div>
          </div>
        </div>
      </Tab>

      <!-- Prometheus Configs -->
      <Tab
        name="prometheus"
        :label="t('monitoring.tabs.prometheus')"
        :weight="weights.prometheus"
      >
        <div>
          <Prometheus
            v-model:value="valuesContent"
            v-bind="$attrs"
            :access-modes="accessModes"
            :mode="mode"
            :storage-classes="storageClasses"
          />
        </div>
      </Tab>

      <!-- Grafana Configs -->
      <Tab
        name="grafana"
        :label="t('monitoring.tabs.grafana')"
        :weight="weights.grafana"
      >
        <div>
          <Grafana
            v-model:value="valuesContent"
            :access-modes="accessModes"
            :mode="mode"
            :pvcs="pvcs"
            :storage-classes="storageClasses"
          />
        </div>
      </Tab>

      <!-- Alerting Configs -->
      <Tab
        name="alerting"
        :label="t('monitoring.tabs.alerting')"
        :weight="weights.alerting"
      >
        <div>
          <Alerting
            v-model:value="valuesContent"
            :mode="mode"
          />
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>
