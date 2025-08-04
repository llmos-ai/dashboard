<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LLMOSWorkload from '@shell/mixins/llmos/ml-workload';
import { MANAGEMENT, PVC, VOLUME_SNAPSHOT } from '@shell/config/types';
import { mergeEnvs } from '@shell/utils/merge';
import { REGISTRY as REGISTRY_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SETTING } from '@shell/config/settings';
import { allHash } from '@shell/utils/promise';
import RemoteModelList from '@shell/edit/ml.llmos.ai.modelservice/RemoteModelList.vue';
import LocalModelList from '@shell/edit/ml.llmos.ai.modelservice/LocalModelList';
import { _CREATE } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import ArgumentVars from './components/ArgumentVars.vue';

export default {
  name:       'EditModelService',
  mixins:     [CreateEditView, FormValidation, LLMOSWorkload, LabeledSelect],
  components: {
    RemoteModelList, ArgumentVars, LocalModelList
  },
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
      type: Function,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = await allHash({
      modelServiceDefaultImage: this.$store.getters[`${ inStore }/byId`](
        MANAGEMENT.SETTING,
        SETTING.MODEL_SERVICE_DEFAULT_IMAGE
      ),
      settings:        this.$store.dispatch(`${ inStore }/findAll`, { type: MANAGEMENT.SETTING }),
      volumeClaims:    this.$store.dispatch(`${ inStore }/findAll`, { type: PVC }),
      volumeSnapshots: this.$store.dispatch(`${ inStore }/findAll`, { type: VOLUME_SNAPSHOT }),
    });

    await this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);

    const huggingFaceProxy = hash.settings?.find(
      (item) => item.id === SETTING.HUGGINGfACE_ENDPOINT
    );

    const container = this.value.spec?.template?.spec?.containers[0];

    const hfToken = container.env.find(
      (env) => env.name === 'HUGGING_FACE_HUB_TOKEN'
    );

    if (!hfToken) {
      this.hfToken = {
        name:      'HUGGING_FACE_HUB_TOKEN',
        valueFrom: { secretKeyRef: { name: '', key: '' } },
      };
    }

    const hfEndpoint = container.env.find((env) => env.name === 'HF_ENDPOINT');

    if (!hfEndpoint && huggingFaceProxy) {
      this.hfEndpoint = { name: 'HF_ENDPOINT', value: huggingFaceProxy.value };
    }

    if (!this.container.image) {
      const systemImageRegistry = hash.settings?.find(
        (item) => item.id === SETTING.GLOBAL_SYSTEM_IMAGE_REGISTRY
      );
      const msDefaultImage =
        hash.modelServiceDefaultImage.value ||
        hash.modelServiceDefaultImage.default;
      const registry = systemImageRegistry?.value || 'ghcr.io';

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

    const items = [{ title: 'Choose Model' }, { title: 'Set Config' }];

    return {
      current: 0,
      items,
      open:    false,
      hfToken: {
        name:      'HUGGING_FACE_HUB_TOKEN',
        valueFrom: { secretKeyRef: { name: '', key: '' } },
      },
      hfEndpoint:      { name: 'HF_ENDPOINT', value: '' },
      excludeEnvs,
      events:          [],
      enableReasoning: false,
      enableTools:     false,
      sourceOptions:   [
        { label: 'HuggingFace', value: 'huggingface' },
        { label: 'ModelScope', value: 'modelscope' },
        { label: 'Local', value: 'local' },
      ],
      vllmTaskOptions: [
        { label: '文本生成', value: 'generate' },
        { label: '文本嵌入(Text Embedding)', value: 'embedding' },
        { label: '重排序(Rerank)', value: 'score' },
      ],
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');

    // 初始化复选框状态
    this.initCheckboxState();
  },

  computed: {
    showRemoteList() {
      return (
        this.spec.modelRegistry === 'huggingface' ||
        this.spec.modelRegistry === 'modelscope'
      );
    },
    disableNext() {
      return !this.spec.modelRegistry;
    },

    showConfig() {
      return this.current === 1 || this.isEdit || this.isView;
    },

    validationPassed() {
      return (
        !!this.spec.modelRegistry &&
        !!this.value.metadata.name &&
        !!this.spec.model
      );
    },

    // 获取和设置容器参数中的--task值
    vllmTask: {
      get() {
        if (!Array.isArray(this.container.args)) {
          // 初始化container.args并添加推荐的任务类型
          this.container.args = [];
          const suggestedTask = this.suggestedVllmTask;

          if (suggestedTask) {
            this.container.args.push(`--task=${ suggestedTask }`);
          }

          return suggestedTask;
        }

        // 检查是否有--task=xxx格式的参数
        const taskEqualArgIndex = this.container.args.findIndex((arg) => arg.startsWith('--task='));

        if (taskEqualArgIndex >= 0) {
          const value = this.container.args[taskEqualArgIndex].split('=')[1];

          // 如果值为auto，则根据模型特性自动设置任务类型
          return value === 'auto' ? this.suggestedVllmTask : value;
        }

        // 检查是否有--task xxx格式的参数
        const taskArgIndex = this.container.args.findIndex((arg) => arg === '--task');

        if (taskArgIndex >= 0 && taskArgIndex < this.container.args.length - 1) {
          const value = this.container.args[taskArgIndex + 1];

          // 如果值为auto，则根据模型特性自动设置任务类型
          return value === 'auto' ? this.suggestedVllmTask : value;
        }

        // 如果没有设置--task参数，则添加推荐的任务类型
        const suggestedTask = this.suggestedVllmTask;

        if (suggestedTask) {
          this.container.args.push(`--task=${ suggestedTask }`);
        }

        return suggestedTask;
      },
      set(value) {
        if (!Array.isArray(this.container.args)) {
          this.container.args = [];
        }

        // 检查是否有--task=xxx格式的参数
        const taskEqualArgIndex = this.container.args.findIndex((arg) => arg.startsWith('--task='));
        // 检查是否有--task xxx格式的参数
        const taskArgIndex = this.container.args.findIndex((arg) => arg === '--task');

        // 移除所有现有的task参数
        if (taskEqualArgIndex >= 0) {
          this.container.args.splice(taskEqualArgIndex, 1);
        }
        if (taskArgIndex >= 0 && taskArgIndex < this.container.args.length - 1) {
          this.container.args.splice(taskArgIndex, 2);
        }

        // 添加新的task参数
        if (value) {
          // 使用--task=value格式
          this.container.args.push(`--task=${ value }`);
        }
      }
    },

    // 判断模型是否为embedding模型
    isEmbeddingModel() {
      const modelName = this.spec.model?.toLowerCase() || '';
      const tags = this.spec.tags || [];

      // 通用：名字中包含embedding
      if (modelName.includes('embedding')) {
        return true;
      }

      // 根据标签判断
      if (tags.some((tag) => [
        'text-embeddings-inference',
        'sentence-similarity',
        'sentence-transformers'
      ].includes(tag))) {
        return true;
      }

      return false;
    },

    // 判断模型是否为rerank模型
    isRerankModel() {
      const modelName = this.spec.model?.toLowerCase() || '';
      const tags = this.spec.tags || [];

      // 通用：名字中包含rerank或特定模型名
      if (modelName.includes('rerank')) {
        return true;
      }

      // 根据标签判断
      if (tags.some((tag) => [
        'text-ranking',
        'text-classification'
      ].includes(tag))) {
        return true;
      }

      return false;
    },

    // 推荐的VLLM任务类型
    suggestedVllmTask() {
      if (this.isEmbeddingModel) {
        return 'embedding';
      } else if (this.isRerankModel) {
        return 'score';
      } else {
        return 'generate';
      }
    },

    // page show logic
    disableModelInput() {
      if (
        (this.spec.modelRegistry &&
        this.mode === _CREATE) || this.isEdit
      ) {
        return true;
      } else {
        return false;
      }
    },
    isHuggingFace() {
      return this.spec.modelRegistry === 'huggingface';
    },
  },

  methods: {
    willSave() {
      this.errors = [];

      // 同步 vllmTask 到 metadata.labels，符合 k8s label 规范
      if (!this.value.metadata.labels) {
        this.value.metadata.labels = {};
      }
      this.value.metadata.labels['ai.llmos/model-task'] = this.vllmTask || '';

      if (Array.isArray(this.container.args)) {
        this.container.args = this.container.args.filter((arg) => !!arg && arg.trim() !== '');
      }

      // 当模型来源为本地模型时，如果用户没有填写servedModelName，则使用spec.model的值
      if (this.spec.modelRegistry === 'local' && !this.spec.servedModelName && this.spec.model) {
        this.spec.servedModelName = this.spec.model;
      }

      this.update();

      if (this.container.image === '') {
        this.errors.push(this.t('validation.required', { key: 'Image' }, true));
      }

      if (
        this.container.resources.requests.cpu === 0 ||
        this.container.resources.requests.memory === 0
      ) {
        this.errors.push(
          this.t('validation.required', { key: 'CPU or Memory' }, true)
        );
      }

      if (this.spec.model === '') {
        this.errors.push(
          this.t('validation.required', { key: 'Model Name' }, true)
        );
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
      const regex =
        /^([a-zA-Z0-9._-]+\/)?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+):([a-zA-Z0-9._-]+)$/;

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
    },
    next() {
      this.current++;
    },
    prev() {
      this.current--;
    },

    // 初始化复选框状态
    initCheckboxState() {
      if (!Array.isArray(this.container.args)) {
        return;
      }

      // 检查参数确定复选框状态
      this.enableReasoning = this.container.args.some((arg) => arg.startsWith('--reasoning-parser='));
      this.enableTools = this.container.args.includes('--enable-auto-tool-choice');
    },

    // 更新推理思考参数
    updateReasoningArgs() {
      if (!Array.isArray(this.container.args)) {
        this.container.args = [];
      }

      // 移除推理相关参数
      this.container.args = this.container.args.filter((arg) => !arg.startsWith('--reasoning-parser='));

      // 如果启用推理思考，添加相应参数
      if (this.enableReasoning) {
        this.container.args.push('--reasoning-parser=deepseek_r1');
      }
    },

    // 更新工具调用参数
    updateToolsArgs() {
      if (!Array.isArray(this.container.args)) {
        this.container.args = [];
      }

      // 移除工具调用相关参数
      this.container.args = this.container.args.filter((arg) => arg !== '--enable-auto-tool-choice' &&
        !arg.startsWith('--tool-call-parser='));

      // 如果启用工具调用，添加相应参数
      if (this.enableTools) {
        this.container.args.push('--enable-auto-tool-choice');
        this.container.args.push('--tool-call-parser=hermes');
      }
    },

    updateModelInfo(item) {
      this.spec.tags = item.tags || [];
      this.spec.pipelineTag = item.pipelineTag || '';
      this.spec.libraryName = item.libraryName || '';
      this.spec.model = item.id;

      // 根据模型信息自动设置VLLM任务类型
      this.$nextTick(() => {
        if (this.vllmTask === 'auto') {
          this.vllmTask = this.suggestedVllmTask;
        }
      });
    },

    async updateLocalModelInfo(localModelVersion = {}) {
      const volumeClaims = await localModelVersion.volumeClaims;

      const namespace = localModelVersion?.metadata?.namespace;
      const localModel = localModelVersion?.spec?.localModel;
      const volumeSnapshotName = localModelVersion?.status?.volumeSnapshot;

      this.spec.model = `${ namespace }/${ localModel }`;

      const volumeClaimTemplate = this.spec.volumeClaimTemplates[0];

      const containerTemplate = this.spec.template.spec.containers[0];

      Object.assign(containerTemplate, {
        volumeMounts: [{
          name:      'model-dir',
          mountPath: '/root/.cache/huggingface/hub/models',
        }, {
          mountPath: '/dev/shm',
          name:      'dshm',
        }]
      });

      const pvc = await this.$store.dispatch('cluster/create', {
        metadata: {
          name:        'model-dir',
          namespace:   volumeClaims?.metadata?.namespace,
          annotations: { [REGISTRY_ANNOTATIONS.IS_LOCAL_MODEL]: 'true' },
        },
        spec: {
          storageClassName: '',
          resources:        { requests: { storage: volumeClaims?.status?.restoreSize } },
          accessModes:      ['ReadWriteOnce'],
          dataSource:       {
            apiGroup: 'snapshot.storage.k8s.io',
            kind:     'VolumeSnapshot',
            name:     volumeSnapshotName
          }

        },
        type: PVC,
      });

      Object.assign(volumeClaimTemplate, pvc);
    },

    updateModelRegistry() {
      this.spec.model = '';
    }
  },

  watch: {
    'spec.modelRegistry'(newValue) {
      const query = { ...this.$route.query };

      if (newValue) {
        query.modelRegistry = newValue;
      } else {
        delete query.modelRegistry;
      }

      if (this.spec.model) {
        query.modelname = this.spec.model;
      }

      this.$router.replace({ query });
    },

    'spec.model'(newValue) {
      const query = { ...this.$route.query };

      if (newValue) {
        query.modelname = newValue;
      } else {
        delete query.modelname;
      }

      if (this.spec.modelRegistry) {
        query.modelRegistry = this.spec.modelRegistry;
      }

      this.$router.replace({ query });

      // 当模型变化时，根据模型特性自动更新VLLM任务类型
      this.$nextTick(() => {
        // 始终根据模型特性自动设置任务类型
        // 这将确保container.args中包含正确的--task参数
        this.vllmTask = this.suggestedVllmTask;
      });
    },

    // 监听container.args的变化，更新复选框状态
    'container.args': {
      handler() {
        // 只有当container.args存在时才更新
        if (Array.isArray(this.container.args)) {
          // 更新复选框状态
          this.enableReasoning = this.container.args.some((arg) => arg.startsWith('--reasoning-parser='));
          this.enableTools = this.container.args.includes('--enable-auto-tool-choice');
        }
      },
      deep: true
    }
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :bannerErrors="errors"
    :apply-hooks="applyHooks"
    class="flex flex-col h-full"
    :validation-passed="validationPassed"
    @finish="save"
    @error="e=>errors = e"
  >
    <a-steps
      v-if="isCreate"
      :current="current"
      :items="items"
      class="mb-10"
      size="small"
    />

    <div v-if="showConfig">
      <NameNsDescription
        :value="value"
        :namespaced="true"
        :mode="mode"
      />
      <ResourceTabs
        :value="value"
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
          <a-row
            :gutter="[16]"
            class="mb-[16px]"
          >
            <a-col :span="24">
              <div class="mb-[8px]">
                <h3>{{ t('modelService.modelTask') }}</h3>
              </div>
              <a-radio-group
                v-model:value="vllmTask"
                :disabled="mode === 'view'"
              >
                <a-radio
                  v-for="option in vllmTaskOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-radio>
              </a-radio-group>
            </a-col>
          </a-row>

          <a-row
            :gutter="[16]"
            class="mb-[16px]"
          >
            <a-col :span="12">
              <LabeledSelect
                v-model:value="spec.modelRegistry"
                :label="t('modelService.source')"
                :options="sourceOptions"
                :mode="mode"
                required
                :disabled="disableModelInput"
              />
            </a-col>

            <a-col :span="12">
              <LabeledInput
                v-model:value="spec.model"
                :required="true"
                :localized-label="true"
                :mode="mode"
                :disabled="disableModelInput"
                :label="t('modelService.model')"
                :tooltip="t('modelService.modelTooltip')"
                :placeholder="t('modelService.modelPlaceholder')"
              />
            </a-col>
          </a-row>

          <a-row
            :gutter="[16, 24]"
            class="mb-[16px]"
          >
            <a-col :span="12">
              <LabeledInput
                v-model:value="spec.servedModelName"
                :localized-label="true"
                :mode="mode"
                :label="t('modelService.modelName')"
                :tooltip="t('modelService.modelNamePlaceholder')"
              />
            </a-col>
          </a-row>

          <a-row
            :gutter="[16]"
            class="mb-[16px]"
          >
            <a-col :span="24">
              <a-space direction="vertical">
                <a-checkbox
                  v-model:checked="enableReasoning"
                  :disabled="isView"
                  @change="updateReasoningArgs"
                >
                  <span class="mr-2">{{ t('modelService.enableReasoning') }}</span>
                </a-checkbox>
                <a-checkbox
                  v-model:checked="enableTools"
                  :disabled="isView"
                  @change="updateToolsArgs"
                >
                  <span class="mr-2">{{ t('modelService.enableTools') }}</span>
                </a-checkbox>
              </a-space>
            </a-col>
          </a-row>

          <a-row
            :gutter="[16]"
            class="mb-[16px]"
          >
            <a-col :span="12">
              <h3>{{ t('workload.container.command.args') }}</h3>
              <ArgumentVars
                v-model="container.args"
                class="w-full"
                :disabled="isView"
              />
            </a-col>
          </a-row>

          <template v-if="isHuggingFace">
            <h3>{{ t("modelService.huggingFaceToken") }}</h3>
            <a-row
              :gutter="[16]"
              class="mb-[16px]"
            >
              <a-col :span="12">
                <ValueFromResource
                  v-model:value="hfToken"
                  :value="hfToken"
                  default-type="secretKeyRef"
                  :all-secrets="namespacedSecrets"
                  :mode="mode"
                  :loading="isLoadingSecondaryResources"
                  @update:value="update"
                />
              </a-col>

              <a-col :span="12">
                <LabeledInput
                  v-model:value="hfEndpoint.value"
                  :localized-label="true"
                  :mode="mode"
                  class="mb-20"
                  :label="t('modelService.hf.endpoint')"
                />
              </a-col>
            </a-row>
          </template>

          <div class="row">
            <div class="col span-12">
              <h3>{{ t("workload.container.titles.env") }}</h3>
              <EnvVars
                :mode="mode"
                :config-maps="namespacedConfigMaps"
                :secrets="namespacedSecrets"
                :value="container"
                :excludes="excludeEnvs"
                :loading="isLoadingSecondaryResources"
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
                  :label="t('modelService.image')"
                />
              </div>

              <div class="col span-6">
                <LabeledSelect
                  v-model:value="spec.serviceType"
                  :mode="mode"
                  :options="svcOptions"
                  :label="t('workload.networking.networkMode.label')"
                  :placeholder="
                    t('workload.networking.networkMode.placeholder')
                  "
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
    </div>

    <div
      v-if="isCreate"
      class="grow-1 h-[0] flex flex-col"
    >
      <LabeledSelect
        v-if="current === 0"
        v-model:value="spec.modelRegistry"
        label="Source"
        :options="sourceOptions"
        :mode="mode"
        required
        class="mb-10"
        @update:value="updateModelRegistry"
      />

      <div class="grow-1">
        <RemoteModelList
          v-if="current === 0 && showRemoteList"
          :key="spec.modelRegistry"
          :default-search="spec.model"
          class="h-full overflow-hidden"
          :source="spec.modelRegistry"
          @update:item="updateModelInfo"
        />
        <LocalModelList
          v-else-if="current === 0 && spec.modelRegistry === 'local'"
          :default-search="spec.model"
          class="h-full overflow-hidden"
          :source="spec.modelRegistry"
          @update:item="updateLocalModelInfo"
        />
      </div>
    </div>

    <template #createBtnPrefix>
      <div
        v-if="isCreate"
        class="inline-block"
      >
        <a-button
          v-if="current === 0"
          type="primary"
          :disabled="disableNext"
          @click="next"
        >
          {{ t('generic.next') }}
        </a-button>

        <a-button
          v-if="current === 1"
          @click="prev"
        >
          {{ t('generic.previous') }}
        </a-button>
      </div>
    </template>
  </CruResource>
</template>
