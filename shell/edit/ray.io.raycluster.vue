<script>
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import UnitInput from '@shell/components/form/UnitInput';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import { allHash } from '@shell/utils/promise';
import CreateEditView from '@shell/mixins/create-edit-view';
import { ANNOTATIONS } from '@shell/config/labels-annotations';
import { LLMOS, RUNTIME_CLASS } from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  name: 'MLClusterEdit',

  components: {
    Tab,
    UnitInput,
    CruResource,
    Checkbox,
    ResourceTabs,
    LabeledInput,
    LabeledSelect,
    AdvancedSection,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({
      clusters:       this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.RAY_CLUSTER }),
      runtimeClasses: this.$store.dispatch(`${ inStore }/findAll`, { type: RUNTIME_CLASS }),
      defaultConfig:  this.$store.dispatch(`${ inStore }/request`, { url: 'v1-public/ui' })
    });

    this.defaultConfig = hash.defaultConfig;
    this.runtimeClasses = hash.runtimeClasses;
  },

  data() {
    const annotations = this.value?.annotations || {};
    const enableGCSFaultTolerance = annotations[ANNOTATIONS.RAY_CLUSTER_FT_ENABLED] === 'true';
    const headGroupSpec = this.value?.spec?.headGroupSpec;
    const headGroupContainer = headGroupSpec?.template?.spec?.containers[0];
    const headGroupSpecResource = headGroupSpec?.template?.spec.containers[0]?.resources;
    const scheduleOnHeadNode = headGroupSpec?.rayStartParams['num-cpus'] !== '0';

    const workerGroupSpecs = this.value?.spec?.workerGroupSpecs || [];
    const workerGroupSpecsResource = workerGroupSpecs[0]?.template?.spec.containers[0]?.resources;
    const gpu = workerGroupSpecsResource?.requests?.['nvidia.com/gpu'] || 0;

    const autoscalerOptions = this.value?.spec?.autoscalerOptions;
    const enableWorkerGPU = workerGroupSpecs[0].template.spec.runtimeClassName === 'nvidia';

    return {
      defaultConfig:   {},
      runtimeClasses:  [],
      schedulerType:   ['volcano'],
      gpu,
      enableGCSFaultTolerance,
      headGroupSpecResource,
      headGroupContainer,
      headGroupSpec,
      savePvcHookName: 'savePvcHook',
      workerGroupSpecs,
      workerGroupSpecsResource,
      autoscalerOptions,
      scheduleOnHeadNode,
      enableWorkerGPU,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    upScalingModeOption() {
      return [{
        label: 'Conservative',
        value: 'Conservative'
      }, {
        label: 'Default',
        value: 'Default'
      }];
    },
    runtimeClassOptions() {
      const opts = [];

      this.runtimeClasses.filter((runtimeClass) => {
        opts.push({
          label: runtimeClass.metadata.name,
          value: runtimeClass.metadata.name,
        });
      });

      return opts;
    }
  },

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.workerGroupSpecsResource.requests.memory === '' || this.headGroupSpecResource.requests.memory === '') {
        this.errors.push(this.t('validation.required', { key: 'Memory' }, true));
      }
      if (this.workerGroupSpecsResource.requests.cpu === '' || this.headGroupSpecResource.requests.cpu === '') {
        this.errors.push(this.t('validation.required', { key: 'CPU' }, true));
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }
    },

    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    },

    update() {
      // set rayVersion
      if (this.value.spec.rayVersion) {
        this.value.spec.headGroupSpec.template.spec.containers[0].image = `rayproject/ray:${ this.value.spec.rayVersion }`;
        this.value.spec.workerGroupSpecs[0].template.spec.containers[0].image = `rayproject/ray:${ this.value.spec.rayVersion }`;
      }

      if (this.scheduleOnHeadNode) {
        this.headGroupSpec.rayStartParams['num-cpus'] = this.headGroupSpecResource.requests.cpu.toString();
      } else {
        this.headGroupSpec.rayStartParams['num-cpus'] = '0';
      }

      const annotations = {
        ...this.value.metadata.annotations,
        [ANNOTATIONS.RAY_CLUSTER_FT_ENABLED]: this.enableGCSFaultTolerance.toString(),
      };

      if (this.enableWorkerGPU) {
        if (this.gpu === 0) {
          this.gpu = 1;
        }
        this.workerGroupSpecs.runtimeClassName = this.runtimeClasses[0]?.name;
      } else {
        this.gpu = 0;
        delete this.workerGroupSpecs.runtimeClassName;
      }

      this.value.spec.workerGroupSpecs[0] = this.workerGroupSpecs[0];
      if (!this.gpu) {
        delete this.value.spec.workerGroupSpecs[0].template.spec.containers[0].resources.requests['nvidia.com/gpu'];
        delete this.value.spec.workerGroupSpecs[0].template.spec.runtimeClassName;
      } else {
        this.value.spec.workerGroupSpecs[0].template.spec.containers[0].resources.requests['nvidia.com/gpu'] = this.gpu;
        this.value.spec.workerGroupSpecs[0].template.spec.runtimeClassName = 'nvidia';
      }

      if (this.value.spec.enableInTreeAutoscaling) {
        this.value.spec.autoscalerOptions = this.autoscalerOptions;
      }

      this.value.setAnnotations(annotations);
    },
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
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
      :mode="mode"
    >
      <Tab
        name="headGroup"
        label="Head Group"
        class="bordered-table"
        :weight="100"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <UnitInput
              v-model="headGroupSpecResource.requests.cpu"
              label="CPU"
              suffix="C"
              required
              :output-modifier="true"
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-model="headGroupSpecResource.requests.memory"
              label="Memory"
              :input-exponent="3"
              :output-modifier="true"
              :increment="1024"
              :mode="mode"
              suffix="Gi"
              required
              @input="update"
            />
          </div>
        </div>

        <AdvancedSection
          class="col span-12 advanced"
          :mode="mode"
        >
          <div class="row">
            <div class="col span-6">
              <Checkbox
                v-model="enableGCSFaultTolerance"
                :mode="mode"
                :label="t('ray.cluster.enableGCS')"
                @input="update"
              />
            </div>

            <div class="col span-6">
              <Checkbox
                v-model="scheduleOnHeadNode"
                :mode="mode"
                :label="t('ray.cluster.allowScheduling')"
                @input="update"
              />
            </div>
          </div>
        </AdvancedSection>
      </Tab>

      <Tab
        name="workerGroup"
        label="Worker Group"
        class="bordered-table"
        :weight="99"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="workerGroupSpecs[0].groupName"
              label="Group Name"
              required
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-model="workerGroupSpecs[0].replicas"
              :hide-unit="true"
              label="Replicas"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <UnitInput
              v-model="workerGroupSpecs[0].minReplicas"
              label="Min Replicas"
              :hide-unit="true"
              required
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-model="workerGroupSpecs[0].maxReplicas"
              label="Max Replicas"
              :hide-unit="true"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <UnitInput
              v-model="workerGroupSpecsResource.requests.cpu"
              label="CPU"
              suffix="C"
              required
              :output-modifier="true"
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-model="workerGroupSpecsResource.requests.memory"
              label="Memory"
              :input-exponent="3"
              :output-modifier="true"
              :increment="1024"
              :mode="mode"
              suffix="Gi"
              required
              @input="update"
            />
          </div>
        </div>

        <h4>Worker GPU Config</h4>
        <div class="row mb-20">
          <div class="col span-6">
            <Checkbox
              v-model="enableWorkerGPU"
              :mode="mode"
              label="Enable GPU"
              @input="update"
            />
          </div>
        </div>
        <div
          v-if="enableWorkerGPU"
          class="row"
        >
          <div class="col span-6">
            <LabeledInput
              v-model="gpu"
              v-int-number
              label="GPU"
              :mode="mode"
              @input="update"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="workerGroupSpecs[0].template.spec.runtimeClassName"
              label="Runtime Class"
              :options="runtimeClassOptions"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>
      </Tab>

      <Tab
        name="AdvancedConfigs"
        label="Advanced Configs"
        class="bordered-table"
        :weight="98"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.rayVersion"
              label="Ray Version"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>

        <h3>AutoScaler Options</h3>
        <div class="row mb-20">
          <div class="col span-6">
            <Checkbox
              v-model="value.spec.enableInTreeAutoscaling"
              :mode="mode"
              label="Enabling Autoscaling"
              @input="update"
            />
          </div>
        </div>
        <div
          v-if="value.spec.enableInTreeAutoscaling"
          class="row mb-20"
        >
          <div class="col span-6">
            <LabeledSelect
              v-if="autoscalerOptions"
              v-model="autoscalerOptions.upscalingMode"
              label="Upscaling Mode"
              :options="upScalingModeOption"
              required
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-if="autoscalerOptions"
              v-model="autoscalerOptions.idleTimeoutSeconds"
              label="Idle Timeout Seconds"
              suffix="s"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </cruresource>
</template>
