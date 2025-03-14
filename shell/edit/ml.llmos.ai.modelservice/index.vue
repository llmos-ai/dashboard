<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LLMOSWorkload from '@shell/mixins/llmos/ml-workload';
import { MANAGEMENT } from '@shell/config/types';
import { mergeEnvs } from '@shell/utils/merge';
import { SETTING } from '@shell/config/settings';
import { allHash } from '@shell/utils/promise';

export default {
  name:   'ModelService',
  mixins: [CreateEditView, FormValidation, LLMOSWorkload],
  props:  {
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
    const hash = await allHash({
      modelServiceDefaultImage: this.$store.getters[`${ inStore }/byId`](MANAGEMENT.SETTING, SETTING.MODEL_SERVICE_DEFAULT_IMAGE),
      systemImageRegistry:      this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: SETTING.GLOBAL_SYSTEM_IMAGE_REGISTRY }),
    });

    if (!this.container.image) {
      const msDefaultImage = hash.modelServiceDefaultImage.value || hash.modelServiceDefaultImage.default;
      const registry = hash.systemImageRegistry?.value || 'ghcr.io';

      const image = this.processImageString(msDefaultImage, registry);

      this.container.image = image;
    }
  },

  data() {
    const excludeEnvs = [
      'HUGGING_FACE_HUB_TOKEN',
      'HF_ENDPOINT',
      'VLLM_USE_MODELSCOPE',
    ];

    this.initializeModelService();
    const container = this.value.spec?.template?.spec?.containers[0];
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
      hfToken,
      hfEndpoint,
      excludeEnvs,
      events:        [],
      sourceOptions: [
        { label: 'HuggingFace', value: 'huggingface' },
        { label: 'ModelScope', value: 'modelscope' },
        { label: 'Local', value: 'local' }
      ]
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    initializeModelService() {
      const container = this.value.spec.template.spec.containers[0];

      if (!container.env) {
        container['env'] = [];
      }

      if (!this.value.spec.volumeClaimTemplates) {
        this.value.spec['volumeClaimTemplates'] = [];
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

    update() {
      this.mergeEnvs();
    },

    mergeEnvs() {
      const huggingFaceEnv = [this.hfToken, this.hfEndpoint];

      this.container.env = mergeEnvs(this.container.env, huggingFaceEnv);
    },

    processImageString(imageString, customRegistry) {
      // Check if the image contains a registry
      const regex = /^([a-zA-Z0-9._-]+\/)?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9._-]+)$/;

      const match = imageString.match(regex);

      if (match) {
        const registry = match[1]; // First group is the optional registry part

        // If a registry is present, return the string as is
        if (registry) {
          return imageString;
        } else {
          // Prepend custom registry if missing
          return `${ customRegistry }/${ imageString }`;
        }
      }
      throw new Error('Invalid image string format.');
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
      v-model:value="value"
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
          <div class="col span-6 mb-10">
            <LabeledSelect
              v-model:value="spec.modelRegistry"
              label="Source"
              :options="sourceOptions"
              :mode="mode"
              required
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model:value="spec.model"
              :required="true"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelService.model')"
              :tooltip="t('modelService.modelTooltip')"
              :placeholder="t('modelService.modelPlaceholder')"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="spec.servedModelName"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelService.modelName')"
              :tooltip="t('modelService.modelNamePlaceholder')"
            />
          </div>
          <div class="col span-6">
            <slot name="command">
              <ShellInput
                v-model:value="container.args"
                :mode="mode"
                :label="t('workload.container.command.args')"
                :placeholder="t('generic.placeholder', {text: '--dtype=half --cpu-offload-gb=10'}, true)"
                @update:value="update"
              />
            </slot>
          </div>
        </div>

        <h4>Hugging Face Hub Token</h4>
        <div class="row">
          <div class="col span-6">
            <ValueFromResource
              v-model:value="hfToken"
              :value="hfToken"
              default-type="secretKeyRef"
              :all-secrets="namespacedSecrets"
              :mode="mode"
              :loading="isLoadingSecondaryResources"
              @update:value="update"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model:value="hfEndpoint.value"
              :localized-label="true"
              :mode="mode"
              class="mb-20"
              :label="t('modelService.hf.endpoint')"
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
                v-model:value="container.image"
                :required="true"
                :mode="mode"
                class="mb-20"
                :label="t('modelService.image')"
              />
            </div>

            <div class="col span-6">
              <LabeledSelect
                v-model:value="spec.serviceType"
                :mode="mode"
                :options="svcOptions"
                :label="t('workload.networking.networkMode.label')"
                :placeholder="t('workload.networking.networkMode.placeholder')"
                @update:value="update"
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
          v-model:value="flatResources"
          :mode="mode"
          :runtime-classes="runtimeClasses"
          :pod-spec="podTemplateSpec"
          :handle-gpu-limit="true"
          :handle-v-gpu="true"
          :show-tip="false"
        />
      </Tab>

      <Tab
        :label="t('generic.volume.title')"
        name="volumes"
        :weight="tabWeightMap['volumes']"
      >
        <Volume
          v-model:value="spec"
          :namespace="value.metadata?.namespace"
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
