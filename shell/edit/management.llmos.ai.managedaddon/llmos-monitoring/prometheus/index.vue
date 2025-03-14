<script>
import { mapGetters } from 'vuex';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import StorageClassSelector from '@shell/edit/management.llmos.ai.managedaddon/llmos-monitoring/StorageClassSelector';
import { set } from '@shell/utils/object';

export default {
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
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

    prometheusPods: {
      type:    Array,
      default: () => ([]),
    },

    storageClasses: {
      type:    Array,
      default: () => ([]),
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  data() {
    return { enablePersistentStorage: !!this.value?.prometheus?.prometheusSpec?.storageSpec?.volumeClaimTemplate?.spec };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    showStorageClasses() {
      return this.storageClasses?.length > 0;
    },
  },

  watch: {
    enablePersistentStorage(enabled) {
      if (!!enabled) {
        this.$set(
          this.value.prometheus.prometheusSpec.storageSpec,
          'volumeClaimTemplate',
          {
            spec: {
              accessModes: ['ReadWriteOnce'],
              resources:   { requests: { storage: '50Gi' } },
            }
          }
        );
      } else {
        this.$delete(
          this.value.prometheus.prometheusSpec.storageSpec,
          'volumeClaimTemplate'
        );
      }
    },
  },

  methods: { set },
};
</script>

<template>
  <div>
    <div class="prometheus-config">
      <div class="row">
        <div class="col span-6 col-full-height">
          <Checkbox
            v-model:value="value.prometheus.prometheusSpec.enableAdminAPI"
            :label="t('monitoring.prometheus.config.adminApi')"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.scrapeInterval"
            :label="t('monitoring.prometheus.config.scrape')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.evaluationInterval"
            :label="t('monitoring.prometheus.config.evaluation')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.retention"
            :label="t('monitoring.prometheus.config.retention')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.retentionSize"
            :label="t('monitoring.prometheus.config.retentionSize')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-12 mt-5">
          <h4 class="mb-0">
            {{ t('monitoring.prometheus.config.resourceLimits') }}
          </h4>
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div
        class="row row-full-height container-flex-center"
        style="min-height: 55px;"
      >
        <div class="col span-6">
          <Checkbox
            v-model:value="enablePersistentStorage"
            data-testid="checkbox-chart-enable-persistent-storage"
            :label="t('monitoring.prometheus.storage.label')"
          />
        </div>
      </div>
      <template v-if="enablePersistentStorage">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
              :label="t('monitoring.prometheus.storage.size')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <div
              v-if="showStorageClasses"
              data-testid="select-chart-prometheus-storage-class"
            >
              <StorageClassSelector
                :mode="mode"
                :options="storageClasses"
                :value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName"
                :label="t('monitoring.prometheus.storage.className')"
                @updateName="(name) => $set(value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec, 'storageClassName', name)"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes"
              :label="t('monitoring.prometheus.storage.mode')"
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
.prometheus-config {
  & > * {
    margin-top: 10px;
  }
}
</style>
