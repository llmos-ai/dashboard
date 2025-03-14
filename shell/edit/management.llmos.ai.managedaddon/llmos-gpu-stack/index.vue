<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import ManagedAddonMixin from '@shell/edit/management.llmos.ai.managedaddon/mixin/addon';
import merge from 'lodash/merge';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import { FlatResources } from '@shell/utils/container-resource';
import { cleanUp } from '@shell/utils/object';
import jsyaml from 'js-yaml';

const weights = {
  basic:         4,
  gpuOperator:   3,
  deviceManager: 2,
  scheduler:     1
};

export default {
  name:       'EditGenericAddon',
  components: {
    ContainerResourceLimit,
    ResourceTabs,
    Tab,
    NameNsDescription,
    Checkbox,
    LabeledInput,
  },
  data() {
    const spec = this.value.spec;
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
      weights,
      valuesContent,
      schedulingOptions: [
        { label: 'Binpack', value: 'binpack' },
        { label: 'Spread', value: 'spread' },
      ],
    };
  },
  mixins: [ManagedAddonMixin],

  computed: {
    flatResources: {
      get() {
        return FlatResources.get(this.valuesContent.gpuStack.deviceManager);
      },
      set(neu) {
        const out = FlatResources.set(neu);

        this.valuesContent.gpuStack.deviceManager.resources = cleanUp(out);
      }
    },
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
      </Tab>

      <!-- Device Manager Configs -->
      <Tab
        name="deviceManager"
        :label="t('managedAddon.tabs.deviceManager')"
        class="bordered-table"
        :weight="weights.deviceManager"
      >
        <div class="mb-20">
          <ContainerResourceLimit
            v-model:value="flatResources"
            :mode="mode"
            :show-tip="false"
          />
        </div>
      </Tab>

      <!-- GPU Operator Configs -->
      <Tab
        name="gpuOperator"
        :label="t('managedAddon.tabs.gpuOperator')"
        class="bordered-table"
        :weight="weights.gpuOperator"
      >
        <div class="row mb-20">
          <Checkbox
            v-model:value="valuesContent.gpuOperator.enabled"
            label="Enable NVIDIA GPU Operator"
            :mode="mode"
            disabled
          />
        </div>

        <h3>{{ t('managedAddon.llmosGPUStack.vGPU.title') }}</h3>
        <div>
          <div class="row mb-20">
            <div class="col span-6 mb-10">
              <LabeledInput
                v-model:value="valuesContent.devicePlugin.splitCount"
                :label="t('managedAddon.llmosGPUStack.deviceSplitCount.label')"
                :tooltip="t('managedAddon.llmosGPUStack.deviceSplitCount.description')"
                :mode="mode"
                required
              />
            </div>
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>
