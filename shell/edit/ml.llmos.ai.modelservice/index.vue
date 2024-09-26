<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LLMOSWorkload from '@shell/mixins/llmos-workload';
import { EVENT } from '@shell/config/types';
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
    await allHash({ events: this.$store.dispatch('cluster/findAll', { type: EVENT }) });
    // loading secondary resources without UI blocking
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const excludeEnvs = [
      'HUGGING_FACE_HUB_TOKEN',
      'HF_ENDPOINT',
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
      hfToken, hfEndpoint, excludeEnvs
    };
  },

  computed: {
    eventOverride() {
      const events = this.$store.getters[`cluster/all`](EVENT);

      return events.filter((event) => {
        if (event.involvedObject?.uid === this.value?.metadata?.uid) {
          return true;
        }

        if (event.involvedObject?.name.includes(`modelservice-${ this.value.metadata?.name }`)) {
          return true;
        }

        return false;
      }).map((event) => {
        return {
          reason:    (`${ event.reason || this.t('generic.unknown') }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message:   event.message || this.t('generic.unknown'),
          date:      event.lastTimestamp || event.firstTimestamp || event.metadata?.creationTimestamp,
          eventType: event.eventType
        };
      });
    },
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
      :eventOverride="eventOverride"
      :useOverrideEvents="true"
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
              :label="t('modelService.model')"
              :tooltip="t('modelService.modelTooltip')"
              :placeholder="t('modelService.modelPlaceholder')"
            />
          </div>
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
