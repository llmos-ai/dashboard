<script>
import UnitInput from '@shell/components/form/UnitInput';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@shell/config/labels-annotations';
import { cleanUp } from '@shell/utils/object';
import { _EDIT, _VIEW, ENABLED, MODE } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { RadioGroup } from '@components/Form/Radio';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { Accelerators, NVIDIA } from '@shell/utils/container-resource';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { NAME as LLMOS } from '@shell/config/product/llmos';

export default {
  components: {
    LabeledSelect, UnitInput, RadioGroup, ToggleSwitch
  },

  props: {
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    Object,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    runtimeClasses: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    handleGpuLimit: {
      type:    Boolean,
      default: false
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },

    showTip: {
      type:    Boolean,
      default: true
    },

    handleVGpu: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const addonConfig = await this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: SETTING.MANAGED_ADDON_CONFIGS });

    this.addonConfigs = JSON.parse(addonConfig.value);
  },

  data() {
    const {
      limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu, gpuType, limitsVGpuMem, limitsVGpuCores,
    } = this.value;

    const enableVGpu = limitsVGpuMem !== undefined || limitsVGpuCores !== undefined;

    return {
      limitsCpu,
      limitsMemory,
      requestsCpu,
      requestsMemory,
      limitsGpu,
      gpuType,
      limitsVGpuMem,
      limitsVGpuCores,
      viewMode:     _VIEW,
      nvidia:       NVIDIA,
      accelerators: Accelerators,
      enableVGpu,
      addonConfigs: null,
      radioStyle:   'display: flex; gap: 10px; align-items: center;',
    };
  },

  watch: {
    value() {
      const {
        limitsCpu, limitsMemory, requestsCpu, requestsMemory, limitsGpu, gpuType, limitsVGpuMem, limitsVGpuCores,
      } = this.value;

      this.limitsCpu = limitsCpu;
      this.limitsMemory = limitsMemory;
      this.requestsCpu = requestsCpu;
      this.requestsMemory = requestsMemory;
      this.limitsGpu = limitsGpu;
      this.limitsVGpuMem = limitsVGpuMem;
      this.limitsVGpuCores = limitsVGpuCores;

      this.podSpec.runtimeClassName = gpuType;
    }
  },

  computed: {
    detailTopColumns() {
      return [
        {
          title: this.$store.getters['i18n/t']('generic.created'),
          name:  'created'
        },
      ];
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
    },

    gpuStackEnabled() {
      if (this.addonConfigs) {
        const gpuStack = this.addonConfigs.AddonConfigs.find((addonConfig) => addonConfig.name === 'llmos-gpu-stack');

        return gpuStack.enabled && gpuStack.status === 'Complete';
      } else {
        return false;
      }
    },

    gpuStackAddonLink() {
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
          namespace: 'llmos-gpu-stack-system',
          id:        'llmos-gpu-stack',
        },
        query,
      };
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateBeforeSave);
    }
  },

  methods: {
    updateLimits() {
      if (!this.enableVGpu) {
        this.limitsVGpuMem = undefined;
        this.limitsVGpuCores = undefined;
      }

      if (this.gpuType === 'nvidia') {
        this.limitsGpu = this.limitsGpu || 1;
      }

      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
        limitsGpu,
        gpuType,
        limitsVGpuMem,
        limitsVGpuCores,
      } = this;

      this.$emit('input', cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        limitsGpu,
        requestsMemory,
        gpuType,
        limitsVGpuMem,
        limitsVGpuCores,
      }));
    },

    updateBeforeSave(value) {
      const {
        limitsCpu,
        limitsMemory,
        requestsCpu,
        requestsMemory,
        limitsGpu,
        gpuType,
        limitsVGpuMem,
        limitsVGpuCores,
      } = this;
      const namespace = this.namespace; // no deep copy in destructure proxy yet

      const out = cleanUp({
        limitsCpu,
        limitsMemory,
        requestsCpu,
        limitsGpu,
        requestsMemory,
        gpuType,
        limitsVGpuMem,
        limitsVGpuCores,
      });

      if (namespace) {
        namespace.setAnnotation(CONTAINER_DEFAULT_RESOURCE_LIMIT, JSON.stringify(out));
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div
        v-if="showTip"
        class="col span-12"
      >
        <p class="helper-text mb-10">
          <t
            v-if="mode === viewMode"
            k="containerResourceLimit.helpTextDetail"
          />
          <t
            v-else
            k="containerResourceLimit.helpText"
          />
        </p>
      </div>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          v-model="requestsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.requestsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-reservation"
          @input="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="requestsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.requestsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-reservation"
          @input="updateLimits"
        />
      </span>
    </div>

    <div class="row mb-20">
      <span class="col span-6">
        <UnitInput
          v-model="limitsCpu"
          :placeholder="t('containerResourceLimit.cpuPlaceholder')"
          :label="t('containerResourceLimit.limitsCpu')"
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          data-testid="cpu-limit"
          @input="updateLimits"
        />
      </span>
      <span class="col span-6">
        <UnitInput
          v-model="limitsMemory"
          :placeholder="t('containerResourceLimit.memPlaceholder')"
          :label="t('containerResourceLimit.limitsMemory')"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          data-testid="memory-limit"
          @input="updateLimits"
        />
      </span>
    </div>

    <div v-if="handleGpuLimit">
      <h3> {{ t('accelerator.label') }}</h3>
      <div v-if="!gpuStackEnabled">
        <div class="gpu-banner">
          <span class="warning">
            GPU operator is not installed, click
            <nuxt-link :to="gpuStackAddonLink">here</nuxt-link>
            to enable it now.
          </span>
        </div>
      </div>
      <div v-else>
        <div class="row mb-20">
          <span class="col span-12">
            <RadioGroup
              v-model="gpuType"
              name="gpuType"
              :mode="mode"
              :options="accelerators"
              :rstyle="radioStyle"
              @input="updateLimits"
            />
          </span>
        </div>

        <div class="row mb-20">
          <span class="col span-6">
            <UnitInput
              v-model="limitsGpu"
              :placeholder="t('containerResourceLimit.gpuPlaceholder')"
              :label="t('containerResourceLimit.limitsGpu')"
              :mode="mode"
              :base-unit="t('suffix.gpus')"
              data-testid="gpu-limit"
              @input="updateLimits"
            />
          </span>
          <span class="col span-6">
            <LabeledSelect
              v-model="podSpec.runtimeClassName"
              label="Runtime Class"
              :options="runtimeClassOptions"
              :mode="mode"
              :clearable="true"
              @input="updateBeforeSave"
            />
          </span>
        </div>

        <h4> {{ t('accelerator.vgpu.title') }} </h4>
        <div class="row mb-20">
          <div class="col span-6">
            <ToggleSwitch
              v-model="enableVGpu"
              name="label-vgpu-toggle"
              :on-label="t('accelerator.vgpu.enableLabel')"
              @input="updateLimits"
            />
          </div>
        </div>
        <div
          v-if="enableVGpu"
          class="row mb-20"
        >
          <span class="col span-6">
            <UnitInput
              v-if="enableVGpu"
              v-model="limitsVGpuMem"
              required
              :placeholder="t('containerResourceLimit.vGPUMemPlaceholder')"
              :label="t('containerResourceLimit.vGPUMem')"
              :mode="mode"
              :base-unit="t('suffix.mib')"
              @input="updateLimits"
            />
          </span>
          <span class="col span-6">
            <UnitInput
              v-if="enableVGpu"
              v-model="limitsVGpuCores"
              :placeholder="t('containerResourceLimit.vGPUCoresPlaceholder')"
              :label="t('containerResourceLimit.vGPUCores')"
              :mode="mode"
              :base-unit="t('suffix.percent')"
              @input="updateLimits"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
$left-border-size: 4px;
.gpu-banner {
  padding: 10px;
  transition: all 0.2s ease;
  line-height: 20px;
  width: 100%;
  border-left: solid $left-border-size transparent;
  display: flex;
  gap: 3px;
  background: var(--warning-banner-bg);
  border-color: var(--warning);
}

</style>
