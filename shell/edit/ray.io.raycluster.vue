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
  CONFIG_MAP,
  MANAGEMENT,
  NODE,
  PVC,
  RUNTIME_CLASS,
  SECRET,
  SERVICE_ACCOUNT,
} from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import {
  FlatResources,
  hasGPUResources,
  VolcanoScheduler,
} from '@shell/utils/container-resource';
import { cleanUp, clone, isEmpty } from '@shell/utils/object';
import EnvVars from '@shell/components/form/EnvVars.vue';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import ResourceManager from '@shell/mixins/resource-manager';
import { MONITORING_GRAFANA_PATH } from '@shell/utils/monitoring';
import { mergeEnvs, mergeObjectValueFromArrayEnv } from '@shell/utils/merge';
import { SETTING } from '@shell/config/settings';
import { _EDIT, ENABLED, MODE } from '@shell/config/query-params';
import { NAME as LLMOS } from '@shell/config/product/llmos';

export const RAY_DEFAULT_MONITORING_CONFIG = {
  RAY_GRAFANA_IFRAME_HOST: '',
  RAY_GRAFANA_HOST:
    'http://llmos-monitoring-grafana.llmos-monitoring-system.svc:80',
  RAY_PROMETHEUS_HOST:
    'http://llmos-monitoring-prometheus.llmos-monitoring-system.svc:9090',
};

export const RAY_MONITORING_ENV_KEYS = [
  'RAY_GRAFANA_IFRAME_HOST',
  'RAY_GRAFANA_HOST',
  'RAY_PROMETHEUS_HOST',
];

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

    const hash = await allHash({
      defaultConfig: this.$store.dispatch(`${ inStore }/request`, { url: 'v1-public/ui' }),
      addonConfigs:  this.$store.dispatch(`${ inStore }/find`, {
        type: MANAGEMENT.SETTING,
        id:   SETTING.MANAGED_ADDON_CONFIGS,
      }),
      systemImageRegistry: this.$store.dispatch(`${ inStore }/find`, {
        type: MANAGEMENT.SETTING,
        id:   SETTING.GLOBAL_SYSTEM_IMAGE_REGISTRY,
      }),
    });

    if (!this.spec.rayVersion) {
      const rayDefaultVersion = await this.$store.getters[`${ inStore }/byId`](
        MANAGEMENT.SETTING,
        SETTING.RAY_CLUSTER_DEFAULT_VERSION
      );

      this.spec.rayVersion =
        rayDefaultVersion?.value || rayDefaultVersion.default;
    }

    if (hash.systemImageRegistry.value) {
      this.systemImageRegistry = hash.systemImageRegistry.value;
    } else {
      this.systemImageRegistry = 'ghcr.io';
    }

    this.defaultConfig = hash.defaultConfig;
    if (hash.addonConfigs.value) {
      this.addonConfigs = JSON.parse(hash.addonConfigs.value);
    }

    // don't block UI for these resources
    await this.resourceManagerFetchSecondaryResources(
      this.secondaryResourceData
    ); // non-blocking
  },

  data() {
    const spec = this.value.spec;
    const autoScaleOptions = spec.autoscalerOptions;

    // head group configs
    const headGroupSpec = spec.headGroupSpec;
    const headGroupContainer = headGroupSpec?.template?.spec?.containers[0];
    const scheduleOnHeadNode =
      headGroupSpec?.rayStartParams['num-cpus'] !== '0';

    // worker group configs
    const workerGroupSpecs = this.value?.spec?.workerGroupSpecs || [];
    const defaultWorkerPodTemplateSpec = workerGroupSpecs[0].template?.spec;
    const monitoringConfig = this.initMonitoringConfig(headGroupContainer);

    return {
      defaultConfig:       {},
      runtimeClasses:      [],
      savePvcHookName:     'savePvcHook',
      spec,
      autoScaleOptions,
      headGroupSpec,
      headGroupContainer,
      scheduleOnHeadNode,
      workerGroupSpecs,
      defaultWorkerPodTemplateSpec,
      monitoringConfig,
      RAY_DEFAULT_MONITORING_CONFIG,
      addonConfigs:        null,
      systemImageRegistry: '',

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
      return [
        {
          label: 'Conservative',
          value: 'Conservative',
        },
        {
          label: 'Default',
          value: 'Default',
        },
      ];
    },

    headGroupFlatResources: {
      get() {
        return FlatResources.get(this.headGroupContainer);
      },

      set(neu) {
        const out = FlatResources.set(neu);

        this.$set(this.headGroupSpec, 'resources', cleanUp(out));
      },
    },

    workerGroupFlatResources: {
      get() {
        return FlatResources.get(
          this.workerGroupSpecs[0]?.template?.spec?.containers[0]
        );
      },

      set(neu) {
        const out = FlatResources.set(neu);

        this.$set(
          this.workerGroupSpecs[0]?.template?.spec?.containers[0],
          'resources',
          cleanUp(out)
        );
      },
    },

    enableGCSFaultTolerance: {
      get() {
        return (
          this.value.metadata.annotations[
            ANNOTATIONS.RAY_CLUSTER_FT_ENABLED
          ] === 'true'
        );
      },
      set(neu) {
        this.value.metadata.annotations[
          ANNOTATIONS.RAY_CLUSTER_FT_ENABLED
        ] = `${ neu }`;
      },
    },

    monitoringEnabled() {
      if (this.addonConfigs) {
        const moni = this.addonConfigs.AddonConfigs.find(
          (addonConfig) => addonConfig.name === 'llmos-monitoring'
        );

        return moni.enabled && moni.status === 'Complete';
      } else {
        return false;
      }
    },

    monitoringAddonLink() {
      const query = {
        [MODE]:    _EDIT,
        [ENABLED]: 'true',
      };

      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          product:   LLMOS,
          cluster:   'local',
          resource:  MANAGEMENT.MANAGED_ADDON,
          namespace: 'llmos-monitoring-system',
          id:        'llmos-monitoring',
        },
        query,
      };
    },

    enableMonitoring: {
      get() {
        return (
          this.value.metadata.annotations[ANNOTATIONS.MONITORING_ENABLED] ===
          'true'
        );
      },
      set(neu) {
        this.value.metadata.annotations[
          ANNOTATIONS.MONITORING_ENABLED
        ] = `${ neu }`;
        if (neu && isEmpty(this.monitoringConfig)) {
          this.monitoringConfig = this.initMonitoringConfig();
        }
      },
    },

    excludeEnvs() {
      return RAY_MONITORING_ENV_KEYS;
    },
  },

  methods: {
    initMonitoringConfig(headGroupContainer) {
      let monitoringConfig = clone(RAY_DEFAULT_MONITORING_CONFIG);

      if (headGroupContainer.env) {
        monitoringConfig = mergeObjectValueFromArrayEnv(
          monitoringConfig,
          headGroupContainer.env
        );
      }

      if (
        !monitoringConfig.RAY_GRAFANA_IFRAME_HOST ||
        monitoringConfig.RAY_GRAFANA_IFRAME_HOST === ''
      ) {
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
                },
              },
            ],
          },
          [SECRET]: {
            applyTo: [
              { var: 'namespacedSecrets' },
              {
                var:         'imagePullNamespacedSecrets',
                parsingFunc: (data) => {
                  return data.filter(
                    (secret) => secret._type === SECRET_TYPES.DOCKER ||
                      secret._type === SECRET_TYPES.DOCKER_JSON
                  );
                },
              },
            ],
          },
          [NODE]: {
            applyTo: [
              { var: 'allNodeObjects' },
              {
                var:         'allNodes',
                parsingFunc: (data) => {
                  return data
                    .filter((node) => {
                      if (!node.status?.conditions) {
                        return false;
                      }

                      for (const condition of node.status.conditions) {
                        if (condition.type === 'Ready') {
                          return condition.status === 'True';
                        }
                      }

                      return false;
                    })
                    .map((node) => node.id);
                },
              },
            ],
          },
        },
      };
    },

    willSave() {
      this.errors = [];
      this.update();

      if (this.spec.rayVersion === '') {
        this.errors.push(
          this.t('validation.required', { key: 'Ray Version' }, true)
        );
      }

      if (
        this.headGroupContainer.resources?.requests?.memory === '' ||
        this.defaultWorkerPodTemplateSpec.resources?.requests?.memory === ''
      ) {
        this.errors.push(
          this.t('validation.required', { key: 'Memory' }, true)
        );
      }
      if (
        this.headGroupContainer.resources?.requests?.cpu === '' ||
        this.defaultWorkerPodTemplateSpec.resources?.requests?.cpu === ''
      ) {
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
        this.headGroupSpec.rayStartParams['num-cpus'] =
          this.headGroupContainer.resources?.requests?.cpu?.toString();
      } else {
        this.headGroupSpec.rayStartParams['num-cpus'] = '0';
      }
      this.headGroupSpec.template.spec.schedulerName = VolcanoScheduler;

      const annotations = {
        ...this.value.metadata.annotations,
        [ANNOTATIONS.RAY_CLUSTER_FT_ENABLED]:
          this.enableGCSFaultTolerance.toString(),
      };

      const workerPodSpec = FlatResources.validateGPU(
        this.defaultWorkerPodTemplateSpec
      );

      if (workerPodSpec) {
        this.workerGroupSpecs[0].template.spec = workerPodSpec;
      }

      if (this.spec.enableInTreeAutoscaling) {
        this.spec.autoscalerOptions = this.autoScaleOptions;
      }

      // set rayVersion
      if (this.spec.rayVersion) {
        this.headGroupContainer.image = `${ this.systemImageRegistry }/llmos-ai/mirrored-rayproject-ray:${ this.spec.rayVersion }`;
        if (hasGPUResources(this.defaultWorkerPodTemplateSpec.containers)) {
          this.defaultWorkerPodTemplateSpec.containers[0].image = `${ this.systemImageRegistry }/llmos-ai/mirrored-rayproject-ray:${ this.spec.rayVersion }-gpu`;
        } else {
          this.defaultWorkerPodTemplateSpec.containers[0].image = `${ this.systemImageRegistry }/llmos-ai/mirrored-rayproject-ray:${ this.spec.rayVersion }`;
        }
        this.defaultWorkerPodTemplateSpec.schedulerName = VolcanoScheduler;
      }

      this.value.setAnnotations(annotations);
      this.mergeEnvs();
    },

    mergeEnvs() {
      let monitoringEnv = [];

      if (this.enableMonitoring) {
        monitoringEnv = Object.entries(this.monitoringConfig).map(
          ([key, value]) => ({
            name: key,
            value,
          })
        );
      } else {
        this.headGroupContainer.env = this.headGroupContainer.env.filter(
          (env) => {
            return !Object.prototype.hasOwnProperty.call(
              RAY_DEFAULT_MONITORING_CONFIG,
              env.name
            );
          }
        );
      }

      this.headGroupContainer.env = mergeEnvs(
        this.headGroupContainer.env,
        monitoringEnv
      );
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
      :tableActions="true"
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
        <div v-if="enableMonitoring">
          <div
            v-if="!monitoringEnabled"
            class="row mb-20"
          >
            <div class="text-banner">
              <span class="warning">
                LLMOS monitoring is not installed, click
                <nuxt-link :to="monitoringAddonLink">here</nuxt-link>
                to enable it now.
              </span>
            </div>
          </div>
          <div class="row mb-20">
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
              <LabeledInput
                v-model="value.spec.rayVersion"
                label="Cluster Ray Version"
                required
                :mode="mode"
                @input="update"
              />
            </div>
          </div>

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
  </CruResource>
</template>

<style lang="scss" scoped>
.text-tips {
  a {
    font-size: small;
    padding: 1px;
  }
}

.text-banner {
  padding: 10px;
  transition: all 0.2s ease;
  line-height: 20px;
  width: 100%;
  border-left: solid 4px transparent;
  display: flex;
  gap: 3px;
  background: var(--warning-banner-bg);
  border-color: var(--warning);
}
</style>
