<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LLMOSWorkload from '@shell/mixins/llmos/ml-workload';
import { MANAGEMENT } from '@shell/config/types';
import { mergeEnvs } from '@shell/utils/merge';
import { SETTING } from '@shell/config/settings';

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

    if (!this.container.image) {
      const msDefaultImage = await this.$store.getters[`${ inStore }/byId`](MANAGEMENT.SETTING, SETTING.MODEL_SERVICE_DEFAULT_IMAGE);

      this.container.image = msDefaultImage?.value || msDefaultImage.default;
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

    const useModelScope = container.env.find((env) => env.name === 'VLLM_USE_MODELSCOPE');
    const modelSource = useModelScope ? 'ModelScope' : 'HuggingFace';

    return {
      hfToken,
      hfEndpoint,
      excludeEnvs,
      modelSource,
      events:        [],
      sourceOptions: ['HuggingFace', 'ModelScope']
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    initializeModelService() {
      const container = this.value.spec.template.spec.containers[0];

      if (!container.env) {
        this.$set(container, 'env', []);
      }

      if (!this.value.spec.volumeClaimTemplates) {
        this.$set(this.value.spec, 'volumeClaimTemplates', []);
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

      // Set use `VLLM_USE_MODELSCOPE` env to true
      if (this.modelSource === 'ModelScope') {
        this.$set(this.container, 'env', [
          {
            name:  'VLLM_USE_MODELSCOPE',
            value: 'True',
          },
        ]);
      } else {
        // remove the `VLLM_USE_MODELSCOPE` env
        this.container.env = this.container.env.filter((env) => env.name !== 'VLLM_USE_MODELSCOPE');
      }

      this.container.env = mergeEnvs(this.container.env, huggingFaceEnv);
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
          <div class="col span-6 mb-10">
            <LabeledSelect
              v-model="modelSource"
              label="Source"
              :options="sourceOptions"
              :mode="mode"
              required
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="spec.model"
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
              v-model="spec.servedModelName"
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
                v-model="container.args"
                :mode="mode"
                :label="t('workload.container.command.args')"
                :placeholder="t('generic.placeholder', {text: '--dtype=half, --cpu-offload-gb=10'}, true)"
                @input="update"
              />
            </slot>
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
                v-model="container.image"
                :required="true"
                :mode="mode"
                class="mb-20"
                :label="t('modelService.image')"
              />
            </div>

            <div class="col span-6">
              <LabeledSelect
                v-model="spec.serviceType"
                :mode="mode"
                :options="svcOptions"
                :label="t('workload.networking.networkMode.label')"
                :placeholder="t('workload.networking.networkMode.placeholder')"
                @input="update"
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
          v-model="spec"
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
