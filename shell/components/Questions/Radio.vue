<script>
import RadioGroup from '@shell/components/form/Radio/RadioGroup.vue';
import Question from './Question';

export default {
  components: { RadioGroup },
  mixins:     [Question]
};
</script>

<template>
  <div class="row">
    <div class="col span-6">
      <RadioGroup
        name="question.variable"
        :mode="mode"
        :labels="Array.isArray(question.options) ? question.options : Object.values(question.options)"
        :options="Array.isArray(question.options) ? question.options : Object.keys(question.options)"
        :value="value"
        :disabled="disabled"
        :label="displayLabel"
        :tooltip="displayTooltip"
        @input="$emit('input', $event)"
      />
    </div>
    <div
      v-if="showDescription"
      class="col span-6 mt-10"
    >
      {{ displayDescription }}
    </div>
  </div>
</template>
