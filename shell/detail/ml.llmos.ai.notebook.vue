<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import LLMOSWorkloadDetails from '@shell/components/llmos/WorkloadDetails';

export default {
  components: { LLMOSWorkloadDetails },
  mixins:     [CreateEditView],
};
</script>

<template>
  <LLMOSWorkloadDetails
    :value="value"
    :mode="mode"
  />
</template>
