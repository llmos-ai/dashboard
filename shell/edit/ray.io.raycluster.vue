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
import {
  CONFIG_MAP, NODE, PVC, RUNTIME_CLASS, SECRET, SERVICE_ACCOUNT
} from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import { FlatResources, GPU_KEY } from '@shell/utils/container-resource';
import { cleanUp, clone, isEmpty } from '@shell/utils/object';
import EnvVars from '@shell/components/form/EnvVars.vue';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import ResourceManager from '@shell/mixins/resource-manager';
import { MONITORING_GRAFANA_PATH } from '@shell/utils/monitoring';
import { mergeEnvs, mergeObjectValueFromArrayEnv } from '@shell/utils/merge';

export const RAY_DEFAULT_MONITORING_CONFIG = {
  RAY_GRAFANA_IFRAME_HOST: '',
  RAY_GRAFANA_HOST:        'http://llmos-monitoring-grafana.llmos-monitoring-system.svc:80',
  RAY_PROMETHEUS_HOST:     'http://llmos-monitoring-prometheus.llmos-monitoring-system.svc:9090',
};

export const RAY_MONITORING_ENV_KEYS = ['RAY_GRAFANA_IFRAME_HOST', 'RAY_GRAFANA_HOST', 'RAY_PROMETHEUS_HOST'];

export default {
  name: 'MLClusterEdit',

  components: {
    EnvVars,
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

  mixins: [CreateEditView, ResourceManager],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({ defaultConfig: this.$store.dispatch(`${ inStore }/request`, { url: 'v1-public/ui' }) });

    this.defaultConfig = hash.defaultConfig;

    // don't block UI for these resources
    await this.resourceManagerFetchSecondaryResources(this.secondaryResourceData); // non-blocking
  },

  data() {
    const spec = this.value.spec;
    const autoScaleOptions = spec.autoscalerOptions;

    // head group configs
    const headGroupSpec = spec.headGroupSpec;
    const headGroupContainer = headGroupSpec?.template?.spec?.containers[0];
    const scheduleOnHeadNode = headGroupSpec?.rayStartParams['num-cpus'] !== '0';

    // worker group configs
    const workerGroupSpecs = this.value?.spec?.workerGroupSpecs || [];
    const defaultWorkerPodTemplateSpec = workerGroupSpecs[0].template?.spec;
    const monitoringConfig = this.initMonitoringConfig(headGroupContainer);

    return {
      defaultConfig:   {},
      runtimeClasses:  [],
      savePvcHookName: 'savePvcHook',
      spec,
      autoScaleOptions,
      headGroupSpec,
      headGroupContainer,
      scheduleOnHeadNode,
      workerGroupSpecs,
      defaultWorkerPodTemplateSpec,
      monitoringConfig,
      RAY_DEFAULT_MONITORING_CONFIG,

      secondaryResourceData: this.secondaryResourceDataConfig(),
      namespacedConfigMaps:  [],
      namespacedSecrets:     [],
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
    },

    enableGCSFaultTolerance: {
      get() {
        return this.value.metadata.annotations[ANNOTATIONS.RAY_CLUSTER_FT_ENABLED] === 'true';
      },
      set(neu) {
        this.value.metadata.annotations[ANNOTATIONS.RAY_CLUSTER_FT_ENABLED] = `${ neu }`;
      }
    },

    enableMonitoring: {
      get() {
        return this.value.metadata.annotations[ANNOTATIONS.MONITORING_ENABLED] === 'true';
      },
      set(neu) {
        this.value.metadata.annotations[ANNOTATIONS.MONITORING_ENABLED] = `${ neu }`;
        if (neu && isEmpty(this.monitoringConfig)) {
          this.monitoringConfig = this.initMonitoringConfig();
        }
      }
    },

    excludeEnvs() {
      return RAY_MONITORING_ENV_KEYS;
    },
  },

  methods: {
    initMonitoringConfig(headGroupContainer) {
      let monitoringConfig = clone(RAY_DEFAULT_MONITORING_CONFIG);

      if (headGroupContainer.env) {
        monitoringConfig = mergeObjectValueFromArrayEnv(monitoringConfig, headGroupContainer.env);
      }

      if (!monitoringConfig.RAY_GRAFANA_IFRAME_HOST || monitoringConfig.RAY_GRAFANA_IFRAME_HOST === '') {
        const serverURL = window.location.origin;
        const url = new URL(serverURL);

        monitoringConfig.RAY_GRAFANA_IFRAME_HOST = `${ url.origin }${ MONITORING_GRAFANA_PATH }`;
      }

      return monitoringConfig;
    },

    secondaryResourceDataConfig() {
      return {
        namespace: this.value?.metadata?.namespace || null,
        data:      {
          [CONFIG_MAP]:      { applyTo: [{ var: 'namespacedConfigMaps' }] },
          [SERVICE_ACCOUNT]: { applyTo: [{ var: 'namespacedServiceNames' }] },
          [RUNTIME_CLASS]:   { applyTo: [{ var: 'runtimeClasses' }] },
          [PVC]:             {
            applyTo: [
              {
                var:         'pvcs',
                parsingFunc: (data) => {
                  return data.filter((pvc) => {
                    return pvc.namespace !== this.value?.metadata?.namespace;
                  });
                }
              },
            ]
          },
          [SECRET]: {
            applyTo: [
              { var: 'namespacedSecrets' },
              {
                var:         'imagePullNamespacedSecrets',
                parsingFunc: (data) => {
                  return data.filter((secret) => (secret._type === SECRET_TYPES.DOCKER || secret._type === SECRET_TYPES.DOCKER_JSON));
                }
              }
            ]
          },
          [NODE]: {
            applyTo: [
              { var: 'allNodeObjects' },
              {
                var:         'allNodes',
                parsingFunc: (data) => {
                  return data.filter((node) => {
                    if (!node.status?.conditions) {
                      return false;
                    }

                    for (const condition of node.status.conditions) {
                      if (condition.type === 'Ready') {
                        return condition.status === 'True';
                      }
                    }

                    return false;
                  }).map((node) => node.id);
                }
              }
            ]
          },
        }
      };
    },

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
      this.mergeEnvs();
    },

    mergeEnvs() {
      let monitoringEnv = [];

      if (this.enableMonitoring) {
        monitoringEnv = Object.entries(this.monitoringConfig).map(([key, value]) => ({
          name: key,
          value
        }));
      } else {
        this.headGroupContainer.env = this.headGroupContainer.env.filter((env) => {
          return !Object.prototype.hasOwnProperty.call(RAY_DEFAULT_MONITORING_CONFIG, env.name);
        });
      }

      this.headGroupContainer.env = mergeEnvs(this.headGroupContainer.env, monitoringEnv);

      // merge envs the arrays and ensure unique names
      // const mergedEnvs = [...this.headGroupContainer.env, ...monitoringEnv].reduce((acc, current) => {
      //   // Check if the current object has a valid value or typed keyRef value
      //   const hasValidName = current.name !== undefined && current.name !== '';
      //   const hasValidValue = current.value !== undefined && current.value !== '';
      //   const hasValidSecretKeyRef = current.valueFrom && current.valueFrom.secretKeyRef && current.valueFrom.secretKeyRef.name !== '' && current.valueFrom.secretKeyRef.key !== '';
      //   const hasValidConfigMapKeyRef = current.valueFrom && current.valueFrom.configMapKeyRef && current.valueFrom.configMapKeyRef.name !== '' && current.valueFrom.configMapKeyRef.key !== '';
      //   const hasValidResourceField = current.valueFrom && current.valueFrom.resourceFieldRef && current.valueFrom.resourceFieldRef.resource !== '';
      //   const hasValidFieldRef = current.valueFrom && current.valueFrom.fieldRef && current.valueFrom.fieldRef.fieldPath !== '';
      //
      //   // If the object has valid data, proceed
      //   if (hasValidName && (hasValidValue || hasValidSecretKeyRef || hasValidConfigMapKeyRef || hasValidResourceField || hasValidFieldRef)) {
      //     // Check if the name already exists in the accumulator
      //     const existingIndex = acc.findIndex((item) => item.name === current.name);
      //
      //     if (existingIndex > -1) {
      //       // Merge or replace the existing object
      //       acc[existingIndex] = { ...acc[existingIndex], ...current };
      //     } else {
      //       // Add the new object if the name does not exist
      //       acc.push(current);
      //     }
      //   }
      //
      //   return acc;
      // }, []);
    }
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
        name="basic"
        :label="t('generic.tabs.basic')"
        class="bordered-table"
        :weight="101"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.rayVersion"
              label="Cluster Ray Version"
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

        <h3>Monitoring</h3>
        <div class="row mb-20">
          <div class="col span-6">
            <Checkbox
              v-model="enableMonitoring"
              :mode="mode"
              :label="t('ray.cluster.enableMonitoring')"
              @input="update"
            />
            <span class="text-tips">
              <a
                href="https://llmos.1block.ai/docs/monitoring"
                target="_blank"
              >
                View more
              </a>
            </span>
          </div>
        </div>
        <div
          v-if="enableMonitoring"
          class="row mb-20"
        >
          <div class="col span-6">
            <LabeledInput
              v-model="monitoringConfig.RAY_GRAFANA_IFRAME_HOST"
              :label="t('ray.monitoring.grafana.iframe')"
              required
              :mode="mode"
              @input="update"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="monitoringConfig.RAY_GRAFANA_HOST"
              :label="t('ray.monitoring.grafana.host')"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>

        <div
          v-if="enableMonitoring"
          class="row mb-20"
        >
          <div class="col span-6">
            <LabeledInput
              v-model="monitoringConfig.RAY_PROMETHEUS_HOST"
              :label="t('ray.monitoring.prometheus.host')"
              required
              :mode="mode"
              @input="update"
            />
          </div>
        </div>

        <AdvancedSection
          class="col span-12 advanced"
          :mode="mode"
        >
          <h3 class="mb-10">
            {{ t('generic.tabs.advanced') }}
          </h3>
          <div class="row mb-20">
            <div class="col span-6">
              <Checkbox
                v-model="enableGCSFaultTolerance"
                :mode="mode"
                :label="t('ray.cluster.enableGCS')"
                @input="update"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-12">
              <h3>{{ t('workload.container.titles.env') }}</h3>
              <EnvVars
                :mode="mode"
                :config-maps="namespacedConfigMaps"
                :secrets="namespacedSecrets"
                :value="headGroupSpec.template.spec.containers[0]"
                :excludes="excludeEnvs"
                :loading="isLoadingSecondaryResources"
                class="mb-20"
              />
            </div>
          </div>
        </AdvancedSection>
      </Tab>
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
            :show-tip="false"
            @input="update"
          />
        </div>

        <AdvancedSection
          class="col span-12 advanced"
          :mode="mode"
        >
          <div class="row mb-20">
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
            :handle-gpu-limit="true"
            :show-tip="false"
            @input="update"
          />
        </div>
      </Tab>
    </ResourceTabs>
  </cruresource>
</template>

<style lang='scss' scoped>
.text-tips {
  a {
    font-size: small;
    padding: 1px;
  }
}
</style>
