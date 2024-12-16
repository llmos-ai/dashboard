<script>
import PercentageBarComponent from '../PercentageBar';

/**
 * This is a wrapper around the PercentageBar component which provides the interface
 * that formatters are expected to have.
 */
export default {
  components: { PercentageBarComponent },
  props:      {
    value: {
      type:    [String, Number],
      default: ''
    },
    row: {
      type:    Object,
      default: () => {}
    },
    col: {
      type:    Object,
      default: () => {}
    }
  },
  computed: {
    percentage() {
      return Number.parseFloat(Number.parseFloat(this.value).toFixed(1));
    }
  }
};
</script>

<template>
  <span>
    <p v-if="typeof value === 'number' && value == 0">
      <PercentageBarComponent
        :value="percentage"
        :show-percentage="true"
      />
    </p>
    <p v-else-if="!value || value === '0' || value === 'n/a' ">
      {{ t('generic.na') }}
    </p>
    <PercentageBarComponent
      v-else
      :value="percentage"
      :show-percentage="true"
    />
  </span>
</template>
