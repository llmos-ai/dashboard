<script>
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: { Checkbox },

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
};
</script>

<template>
  <div>
    <div class="alerting-config">
      <div class="row">
        <div class="col span-6">
          <Checkbox
            v-model:value="value.alertmanager.enabled"
            :label="t('monitoring.alerting.enable.label')"
          />
        </div>
      </div>
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
