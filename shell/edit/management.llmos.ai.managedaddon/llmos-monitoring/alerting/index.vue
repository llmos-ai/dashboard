<script>
import isEmpty from 'lodash/isEmpty';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: {
    Checkbox,
    LabeledSelect,
    RadioGroup,
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    monitoringSecrets: {
      type:    Array,
      default: () => [],
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      useExistingLabels: [
        this.t('monitoring.alerting.secrets.new'),
        this.t('monitoring.alerting.secrets.existing'),
      ],
      useExistingOptions: [false, true],
    };
  },

  computed: {
    allSecrets() {
      return this.monitoringSecrets
        .map((sec) => ({ label: sec.metadata.name, value: sec.metadata.name }));
    },

    existingSecret() {
      return this.monitoringSecrets
        .find((sec) => sec?.metadata?.name === 'alertmanager-llmos-monitoring-alertmanager');
    },

    filteredSecrets() {
      const filtered = [];

      this.monitoringSecrets.forEach((secret) => {
        if ( secret.metadata.name ) {
          filtered.push(secret.metadata.name);
        }
      });

      return filtered;
    },

    forceCreateNewSecret() {
      const { filteredSecrets } = this;

      return isEmpty(filteredSecrets);
    },
  },

  watch: {
    filteredSecrets(newValue) {
      if (isEmpty(newValue)) {
        this.$set(
          this.value.alertmanager.alertmanagerSpec,
          'useExistingSecret',
          false
        );
      }

      const { existingSecret } = this;

      if (existingSecret) {
        this.$nextTick(() => {
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'useExistingSecret',
            true
          );
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'configSecret',
            existingSecret.metadata.name
          );
        });
      }
    },
    'value.alertmanager.alertmanagerSpec.useExistingSecret'(useExistingSecret) {
      const { existingSecret } = this;

      if (useExistingSecret) {
        if (existingSecret?.metadata?.name) {
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'configSecret',
            existingSecret.metadata.name
          );
        }
      } else {
        this.$set(this.value.alertmanager.alertmanagerSpec, 'configSecret', '');
      }
    },
  },

  beforeMount() {
    const amSecrets = this.value?.alertmanager?.alertmanagerSpec?.secrets ?? [];

    if (this.existingSecret && amSecrets.length <= 0) {
      this.$set(this.value.alertmanager.alertmanagerSpec, 'useExistingSecret', true);
    }
  },
};
</script>

<template>
  <div>
    <div class="alerting-config">
      <div class="row">
        <div class="col span-6">
          <Checkbox
            v-model="value.alertmanager.enabled"
            :label="t('monitoring.alerting.enable.label')"
          />
        </div>
      </div>
      <template v-if="value.alertmanager.enabled">
        <h3 class="mt-20">
          {{ t('monitoring.alerting.secrets.radio.label') }}
          <i
            v-clean-tooltip="t('monitoring.alerting.secrets.info', {}, raw=true)"
            class="icon icon-info icon-lg"
          />
        </h3>
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model="value.alertmanager.alertmanagerSpec.useExistingSecret"
              name="useExistingSecret"
              :disabled="forceCreateNewSecret"
              :mode="mode"
              :labels="useExistingLabels"
              :options="useExistingOptions"
            />
            <LabeledSelect
              v-if="value.alertmanager.alertmanagerSpec.useExistingSecret"
              v-model="value.alertmanager.alertmanagerSpec.configSecret"
              class="provider mt-5"
              :label="t('monitoring.alerting.secrets.label')"
              :options="filteredSecrets"
            />
          </div>
        </div>

        <div
          v-if="allSecrets.length > 0"
          class="row"
        >
          <div class="col span-6">
            <h4>{{ t('monitoring.alerting.secrets.additional.label') }}</h4>
            <LabeledSelect
              v-model="value.alertmanager.alertmanagerSpec.secrets"
              :options="allSecrets"
              :label="t('monitoring.alerting.secrets.additional.label')"
              :mode="mode"
              :multiple="true"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alerting-config {
  > .row {
    padding: 10px 0;
  }
  .banner {
    &.info {
      margin-bottom: 0;
      margin-top: 0;
    }
  }
}
</style>
