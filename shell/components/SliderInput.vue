<script>
import VueSlider from 'vue-slider-component';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { typeOf } from '@shell/utils/sort';

export default {
  components: { UnitInput, VueSlider },
  model:      {
    prop:  'value',
    event: 'change'
  },
  props: {
    value: {
      type:    Number,
      default: 0
    },
    min: {
      type:    Number,
      default: 0
    },
    max: {
      type:    Number,
      default: 2
    },
    interval: {
      type:    Number,
      default: 0.1
    },
    label: {
      type:    String,
      default: ''
    },
    description: {
      type:    String,
      default: ''
    }
  },

  data() {
    return { currentValue: this.value };
  },

  methods: {
    updateValue(value) {
      this.currentValue = value;
      this.$emit('change', value);
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-8 flex-center">
        <span class="label">{{ label }}</span>
        <i
          v-if="description"
          v-tooltip="description"
          class="icon-info pl-5"
        />
      </div>
      <div class="col span-4">
        <UnitInput
          v-model="currentValue"
          :hide-unit="true"
          :step="interval"
          :min="min"
          :max="max"
          :native="true"
          @input="updateValue"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <VueSlider
          v-model="currentValue"
          :min="min"
          :max="max"
          :interval="interval"
          :tooltip="'none'"
          class="slider"
          @input="updateValue"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider {
  padding-left: 4px !important;
  padding-right: 0px !important;
}

.flex-center {
  display: flex;
  align-items: center;
}
</style>
