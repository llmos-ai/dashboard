<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import StorageClassSelector from '@shell/edit/management.llmos.ai.managedaddon/llmos-monitoring/StorageClassSelector';
import { DEFAULT_GRAFANA_STORAGE_SIZE } from '@shell/config/types';

export default {
  components: {
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    StorageClassSelector,
  },
  props: {
    accessModes: {
      type:     Array,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    storageClasses: {
      type:    Array,
      default: () => {
        return [];
      },
    },

    pvcs: {
      type:    Array,
      default: () => {
        return [];
      },
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },
  data() {
    const persistentStorageTypes = ['disabled', 'existing', 'statefulset'];
    const persistentStorageTypeLabels = [
      this.t('generic.disabled'),
      this.t('monitoring.grafana.storage.types.existing'),
      this.t('monitoring.grafana.storage.types.statefulset'),
    ];

    if (this.pvcs.length < 1) {
      persistentStorageTypes.splice(1, 1);
      persistentStorageTypeLabels.splice(1, 1);
    }

    const persistence = this.value?.grafana?.persistence || {};

    let persistentStorageType;

    switch (persistence.type) {
    case 'statefulset':
      persistentStorageType = 'statefulset';
      break;
    default:
      persistentStorageType = persistence.existingClaim ? 'existing' : 'disabled';
    }

    return {
      persistentStorageTypes,
      persistentStorageTypeLabels,
      persistentStorageType,
    };
  },
  computed: {
    showStorageClasses() {
      return this.storageClasses?.length > 0;
    },
    showGrafanaResourceConfig() {
      const resources = this.value?.grafana?.resources;

      return resources?.requests && resources?.limits;
    }
  },
  watch: {
    persistentStorageType(newType, oldType) {
      const resetValsOut = oldType === 'existing' ? {
        existingClaim: null, subPath: null, type: null
      } : oldType === 'statefulset' ? {
        accessModes: null, storageClassName: null, size: null, subPath: null
      } : null;

      const newValsOut = newType === 'existing' ? {
        existingClaim: null, subPath: null, type: null, enabled: true
      } : newType === 'statefulset' ? {
        accessModes:      null,
        storageClassName: null,
        size:             DEFAULT_GRAFANA_STORAGE_SIZE,
        subPath:          null,
        type:             'statefulset',
        enabled:          true,
      } : null;

      if (resetValsOut) this.value.grafana['persistence'] = resetValsOut;
      if (newValsOut) this.value.grafana['persistence'] = newValsOut;
      else delete this.value.grafana['persistence'];
    },
  }
};
</script>

<template>
  <div>
    <!-- Resource Configuration -->
    <div class="grafana-config">
      <div
        v-if="showGrafanaResourceConfig"
        class="row"
      >
        <div class="col span-12 mt-5">
          <h4 class="mb-0">
            {{ t('monitoring.prometheus.config.resourceLimits') }}
          </h4>
        </div>
      </div>

      <div
        v-if="showGrafanaResourceConfig"
        class="row"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.requests.cpu"
            data-testid="input-grafana-requests-cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.requests.memory"
            data-testid="input-grafana-requests-memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :mode="mode"
          />
        </div>
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.limits.cpu"
            data-testid="input-grafana-limits-cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.limits.memory"
            data-testid="input-grafana-limits-memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
      </div>

      <!-- Storage Configuration -->
      <div class="row pt-10 pb-10">
        <div class="col span-12 persistent-storage-config">
          <RadioGroup
            v-model:value="persistentStorageType"
            name="persistentStorageType"
            :label="t('monitoring.grafana.storage.label')"
            :labels="persistentStorageTypeLabels"
            :mode="mode"
            :options="persistentStorageTypes"
            data-testid="radio-group-input-grafana-storage"
          />
        </div>
      </div>

      <!-- Existing Storage -->
      <template v-if="persistentStorageType === 'existing'">
        <div class="row">
          <div class="col span-6">
            <StorageClassSelector
              :value="value.grafana.persistence.existingClaim"
              :mode="mode"
              :options="pvcs"
              :label="t('monitoring.grafana.storage.existingClaim')"
              @updateName="(name) => $set(value.grafana.persistence, 'existingClaim', name)"
            />
          </div>
        </div>
      </template>

      <!-- StatefulSet Storage -->
      <template v-else-if="persistentStorageType === 'statefulset'">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.grafana.persistence.size"
              :label="t('monitoring.grafana.storage.size')"
              :mode="mode"
              data-testid="grafana-storage-statefulset-size"
            />
          </div>
          <div class="col span-6">
            <div v-if="showStorageClasses">
              <StorageClassSelector
                :value="value.grafana.persistence.storageClassName"
                :mode="mode"
                :options="storageClasses"
                :label="t('monitoring.prometheus.storage.className')"
                @updateName="(name) => $set(value.grafana.persistence, 'storageClassName', name)"
              />
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.grafana.persistence.accessModes"
              :label="t('monitoring.grafana.storage.mode')"
              :localized-label="true"
              :mode="mode"
              :multiple="true"
              :options="accessModes"
              :reduce="({id})=> id"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.grafana-config {
  & > * {
    margin-top: 10px;
  }
}
</style>
