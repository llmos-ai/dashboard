<script>
import Tab from '@shell/components/Tabbed/Tab.vue';
import CruResource from '@shell/components/CruResource.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import EnvVars from '@shell/components/form/EnvVars.vue';
import ValueFromResource from '@shell/components/form/ValueFromResource.vue';
import ShellInput from '@shell/components/form/ShellInput.vue';
import NodeScheduling from '@shell/components/form/NodeScheduling.vue';

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import ResourceManager from '@shell/mixins/resource-manager';
import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import {
  CONFIG_MAP,
  LLMOS,
  NODE,
  PVC, RUNTIME_CLASS,
  SECRET,
} from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { cleanUp } from '@shell/utils/object';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import Volume from '@shell/edit/volume/index.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';

const TAB_WEIGHT_MAP = {
  general:        99,
  resources:      98,
  volumes:        97,
  nodeScheduling: 96,
};
const GPU_KEY = 'nvidia.com/gpu';

export default {
  name:       'ModelService',
  components: {
    AdvancedSection,
    ContainerResourceLimit,
    CruResource,
    Checkbox,
    EnvVars,
    LabeledInput,
    NameNsDescription,
    NodeScheduling,
    ResourceTabs,
    ShellInput,
    Tab,
    ValueFromResource,
    Volume,
  },

  mixins: [CreateEditView, FormValidation, ResourceManager],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    createOption: {
      default: (text) => {
        if (text) {
          return { metadata: { name: text } };
        }
      },
      type: Function
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    // User might not have access to required resources - so check before trying to fetch
    const hash = await allHash({
      mss:            this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.MODEL_SERVICE }),
      runtimeClasses: this.$store.dispatch(`${ inStore }/findAll`, { type: RUNTIME_CLASS }),
    });

    this.runtimeClasses = hash.runtimeClasses;

    // loading secondary resources without UI blocking
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const excludeEnvs = [
      'HUGGING_FACE_HUB_TOKEN',
      'HF_ENDPOINT',
    ];

    this.initializeModelService();
    const namespace = this.value.metadata.namespace;
    const spec = this.value.spec;
    const podTemplateSpec = this.value.spec.template.spec;
    const container = podTemplateSpec.containers[0];

    let hfToken = container.env.find((env) => env.name === 'HUGGING_FACE_HUB_TOKEN');

    if (!hfToken) {
      hfToken = {
        name:      'HUGGING_FACE_HUB_TOKEN',
        valueFrom: { secretKeyRef: { name: '', key: '' } },
      };
    }

    let hfEndpoint = container.env.find((env) => env.name === 'HF_ENDPOINT');

    if (!hfEndpoint) {
      hfEndpoint = { name: 'HF_ENDPOINT', value: '' };
    }

    return {
      secondaryResourceData: this.secondaryResourceDataConfig(),
      namespacedConfigMaps:  [],
      allNodes:              null,
      pvcs:                  [],
      namespacedSecrets:     [],
      runtimeClasses:        [],
      savePvcHookName:       'savePvcHook',
      tabWeightMap:          TAB_WEIGHT_MAP,
      isNamespaceNew:        false,
      useNodeSharedMemory:   false,
      hfToken,
      hfEndpoint,
      namespace,
      spec,
      container,
      podTemplateSpec,
      excludeEnvs,
    };
  },

  watch: {
    async 'value.metadata.namespace'(neu) {
      if (this.isNamespaceNew) {
        // we don't need to re-fetch namespace specific (or non-namespace specific) resources when the namespace hasn't been created yet
        return;
      }
      this.secondaryResourceData.namespace = neu;
      // Fetch resources that are namespace specific, we don't need to re-fetch non-namespaced resources on namespace change
      this.resourceManagerFetchSecondaryResources(this.secondaryResourceData, true);

      // this.servicesOwned = await this.value.getServicesOwned();
    },

    isNamespaceNew(neu, old) {
      if (!old && neu) {
        // As the namespace is new any resource that's been fetched with a namespace is now invalid
        this.resourceManagerClearSecondaryResources(this.secondaryResourceData, true);
      }
    },
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.container.resources || {};
        const {
          cpu: limitsCpu,
          memory: limitsMemory,
          [GPU_KEY]: limitsGpu,
        } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        };
      },
      set(neu) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
          limitsGpu,
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory,
          },
          limits: {
            cpu:       limitsCpu,
            memory:    limitsMemory,
            [GPU_KEY]: limitsGpu,
          },
        };

        this.$set(this.container, 'resources', cleanUp(out));
      },
    },
  },

  methods: {
    secondaryResourceDataConfig() {
      return {
        namespace: this.value?.metadata?.namespace || null,
        data:      {
          [NODE]: {
            applyTo: [
              {
                var:         'allNodes',
                parsingFunc: (data) => {
                  return data.map((node) => node.id);
                }
              }
            ]
          },
          [CONFIG_MAP]: { applyTo: [{ var: 'namespacedConfigMaps' }] },
          [PVC]:        { applyTo: [{ var: 'pvcs' }] },
          [SECRET]:     {
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
        }
      };
    },

    initializeModelService() {
      const container = this.value.spec.template.spec.containers[0];

      if (!container.env) {
        this.$set(container, 'env', []);
      }

      if (!this.value.spec.volumeClaimTemplates) {
        this.$set(this.value.spec, 'volumeClaimTemplates', []);
      }
    },

    clearPvcFormState(hookName) {
      // On the `closePvcForm` event, remove the
      // before save hook to prevent the PVC from
      // being created. Use the PVC's unique ID to distinguish
      // between hooks for different PVCs.
      if (this[BEFORE_SAVE_HOOKS]) {
        this.unregisterBeforeSaveHook(hookName);
      }
    },

    willSave() {
      this.errors = [];
      this.update();

      if (this.container.image === '') {
        this.errors.push(this.t('validation.required', { key: 'Image' }, true));
      }

      if (this.container.resources.requests.cpu === 0 || this.container.resources.requests.memory === 0) {
        this.errors.push(this.t('validation.required', { key: 'CPU or Memory' }, true));
      }

      if (this.spec.model === '') {
        this.errors.push(this.t('validation.required', { key: 'Model Name' }, true));
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }
    },

    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    },

    update() {
      this.mergeEnvs();
    },

    mergeEnvs() {
      const huggingFaceEnv = [this.hfToken, this.hfEndpoint];

      // merge envs the arrays and ensure unique names
      const mergedEnvs = [...this.container.env, ...huggingFaceEnv].reduce((acc, current) => {
        // Check if the current object has a valid value or typed keyRef value
        const hasValidName = current.name !== undefined && current.name !== '';
        const hasValidValue = current.value !== undefined && current.value !== '';
        const hasValidSecretKeyRef = current.valueFrom && current.valueFrom.secretKeyRef && current.valueFrom.secretKeyRef.name !== '' && current.valueFrom.secretKeyRef.key !== '';
        const hasValidConfigMapKeyRef = current.valueFrom && current.valueFrom.configMapKeyRef && current.valueFrom.configMapKeyRef.name !== '' && current.valueFrom.configMapKeyRef.key !== '';
        const hasValidResourceField = current.valueFrom && current.valueFrom.resourceFieldRef && current.valueFrom.resourceFieldRef.resource !== '';
        const hasValidFieldRef = current.valueFrom && current.valueFrom.fieldRef && current.valueFrom.fieldRef.fieldPath !== '';

        // If the object has valid data, proceed
        if (hasValidName && (hasValidValue || hasValidSecretKeyRef || hasValidConfigMapKeyRef || hasValidResourceField || hasValidFieldRef)) {
          // Check if the name already exists in the accumulator
          const existingIndex = acc.findIndex((item) => item.name === current.name);

          if (existingIndex > -1) {
            // Merge or replace the existing object
            acc[existingIndex] = { ...acc[existingIndex], ...current };
          } else {
            // Add the new object if the name does not exist
            acc.push(current);
          }
        }

        return acc;
      }, []);

      this.container.env = mergedEnvs;
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
        name="general"
        label="General"
        class="bordered-table"
        :weight="tabWeightMap.general"
      >
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model="spec.model"
              :required="true"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelservice.model')"
              :tooltip="t('modelservice.modelTooltip')"
              :placeholder="t('modelservice.modelPlaceholder')"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="spec.servedModelName"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelservice.modelName')"
              :tooltip="t('modelservice.modelNamePlaceholder')"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <slot name="command">
              <ShellInput
                v-model="container.args"
                :mode="mode"
                :label="t('workload.container.command.args')"
                :placeholder="t('generic.placeholder', {text: '--dtype=half, --cpu-offload-gb=10'}, true)"
                @input="update"
              />
            </slot>
          </div>
          <div class="col span-6">
            <Checkbox
              v-model="spec.enableGUI"
              :mode="mode"
              label="Enable Gradio UI"
              @input="update"
            />
          </div>
        </div>

        <h4>Hugging Face Hub Token</h4>
        <div class="row">
          <div class="col span-6">
            <ValueFromResource
              v-model="hfToken"
              :value="hfToken"
              default-type="secretKeyRef"
              :all-secrets="namespacedSecrets"
              :mode="mode"
              :loading="isLoadingSecondaryResources"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="hfEndpoint.value"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelservice.hf.endpoint')"
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
              :value="container"
              :excludes="excludeEnvs"
              :loading="isLoadingSecondaryResources"
              class="mb-20"
            />
          </div>
        </div>

        <AdvancedSection
          class="col span-12 advanced"
          :mode="mode"
        >
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model="container.image"
                :required="true"
                :mode="mode"
                class="mb-20"
                :label="t('modelservice.image')"
              />
            </div>
          </div>
        </AdvancedSection>
      </Tab>

      <Tab
        :label="t('workload.container.titles.resources')"
        name="resources"
        :weight="tabWeightMap['resources']"
      >
        <!-- Resources and Limitations -->
        <ContainerResourceLimit
          v-model="flatResources"
          :mode="mode"
          :runtime-classes="runtimeClasses"
          :pod-spec="podTemplateSpec"
          :show-tip="false"
        />
      </Tab>

      <Tab
        :label="t('generic.volume.title')"
        name="volumes"
        :weight="tabWeightMap['volumes']"
      >
        <Volume
          v-model="spec"
          :namespace="namespace"
          :register-before-hook="registerBeforeHook"
          :mode="mode"
          :save-pvc-hook-name="savePvcHookName"
          :loading="isLoadingSecondaryResources"
          :namespaced-pvcs="pvcs"
          @removePvcForm="clearPvcFormState"
        />
      </Tab>

      <Tab
        :label="t('workload.container.titles.nodeScheduling')"
        name="nodeScheduling"
        :weight="tabWeightMap['nodeScheduling']"
      >
        <NodeScheduling
          :mode="mode"
          :value="podTemplateSpec"
          :nodes="allNodes"
          :loading="isLoadingSecondaryResources"
        />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
