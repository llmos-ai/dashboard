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
import { RUNTIME_CLASS } from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import { FlatResources, GPU_KEY } from '@shell/utils/container-resource';
import { cleanUp } from '@shell/utils/object';

export default {
  name: 'MLClusterEdit',

  components: {
    ContainerResourceLimit,
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
      runtimeClasses: this.$store.dispatch(`${ inStore }/findAll`, { type: RUNTIME_CLASS }),
      defaultConfig:  this.$store.dispatch(`${ inStore }/request`, { url: 'v1-public/ui' })
    });

    this.defaultConfig = hash.defaultConfig;
    this.runtimeClasses = hash.runtimeClasses;
  },

  data() {
    const spec = this.value.spec;
    const annotations = this.value?.annotations || {};
    const enableGCSFaultTolerance = annotations[ANNOTATIONS.RAY_CLUSTER_FT_ENABLED] === 'true';
    const autoScaleOptions = spec.autoscalerOptions;

    // head group configs
    const headGroupSpec = spec.headGroupSpec;
    const headGroupContainer = headGroupSpec?.template?.spec?.containers[0];
    const scheduleOnHeadNode = headGroupSpec?.rayStartParams['num-cpus'] !== '0';

    // worker group configs
    const workerGroupSpecs = this.value?.spec?.workerGroupSpecs || [];
    const defaultWorkerPodTemplateSpec = workerGroupSpecs[0].template?.spec;

    return {
      defaultConfig:   {},
      runtimeClasses:  [],
      savePvcHookName: 'savePvcHook',
      spec,
      autoScaleOptions,
      enableGCSFaultTolerance,
      headGroupSpec,
      headGroupContainer,
      scheduleOnHeadNode,
      workerGroupSpecs,
      defaultWorkerPodTemplateSpec,
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

    headGroupFlatResources: {
      get() {
        return FlatResources.get(this.headGroupContainer);
      },

      set(neu) {
        const out = FlatResources.set(neu);

        this.$set(this.headGroupSpec, 'resources', cleanUp(out));
      }
    },

    workerGroupFlatResources: {
      get() {
        return FlatResources.get(this.workerGroupSpecs[0]?.template?.spec?.containers[0]);
      },

      set(neu) {
        const out = FlatResources.set(neu);

        this.$set(this.workerGroupSpecs[0]?.template?.spec?.containers[0], 'resources', cleanUp(out));
      }
    }
  },

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.headGroupContainer.resources?.requests?.memory === '' ||
          this.defaultWorkerPodTemplateSpec.resources?.requests?.memory === '') {
        this.errors.push(this.t('validation.required', { key: 'Memory' }, true));
      }
      if (this.headGroupContainer.resources?.requests?.cpu === '' ||
          this.defaultWorkerPodTemplateSpec.resources?.requests?.cpu === '') {
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
      if (this.scheduleOnHeadNode) {
        this.headGroupSpec.rayStartParams['num-cpus'] = this.headGroupContainer.resources?.requests?.cpu?.toString();
      } else {
        this.headGroupSpec.rayStartParams['num-cpus'] = '0';
      }

      const annotations = {
        ...this.value.metadata.annotations,
        [ANNOTATIONS.RAY_CLUSTER_FT_ENABLED]: this.enableGCSFaultTolerance.toString(),
      };

      const workerPodSpec = FlatResources.validateGPU(this.defaultWorkerPodTemplateSpec);

      if (workerPodSpec) {
        this.workerGroupSpecs[0].template.spec = workerPodSpec;
      }

      if (this.spec.enableInTreeAutoscaling) {
        this.spec.autoscalerOptions = this.autoScaleOptions;
      }

      // set rayVersion
      if (this.spec.rayVersion) {
        const nvidiaGpuLimit = this.defaultWorkerPodTemplateSpec.containers[0]?.resources?.limits?.[GPU_KEY];

        this.headGroupContainer.image = `rayproject/ray:${ this.spec.rayVersion }`;
        if (nvidiaGpuLimit > 0) {
          this.defaultWorkerPodTemplateSpec.containers[0].image = `rayproject/ray:${ this.spec.rayVersion }-gpu`;
        } else {
          this.defaultWorkerPodTemplateSpec.containers[0].image = `rayproject/ray:${ this.spec.rayVersion }`;
        }
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
        <div class="mb-20">
          <!-- Resources and Limitations -->
          <ContainerResourceLimit
            v-model="headGroupFlatResources"
            :mode="mode"
            :runtime-classes="runtimeClasses"
            :pod-spec="headGroupSpec.template.spec"
            :handle-gpu-limit="false"
            :show-tip="false"
            @input="update"
          />
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
            <UnitInput
              v-model="workerGroupSpecs[0].replicas"
              :hide-unit="true"
              label="Replicas"
              required
              :mode="mode"
              @input="update"
            />
          </div>
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
        </div>

        <div class="row mb-20">
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

        <h4>Worker Resources</h4>
        <div class="mb-20">
          <!-- Worker Group Resources and Limitations -->
          <ContainerResourceLimit
            v-model="workerGroupFlatResources"
            :mode="mode"
            :runtime-classes="runtimeClasses"
            :pod-spec="workerGroupSpecs[0].template.spec"
            :show-tip="false"
            @input="update"
          />
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
              v-if="autoScaleOptions"
              v-model="autoScaleOptions.upscalingMode"
              label="Upscaling Mode"
              :options="upScalingModeOption"
              required
              :mode="mode"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-if="autoScaleOptions"
              v-model="autoScaleOptions.idleTimeoutSeconds"
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
