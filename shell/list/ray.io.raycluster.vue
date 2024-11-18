<script>
import LLMOSWorkloadList from '@shell/components/llmos/WorkloadList';

export default {
  name:       'MLClusterList',
  components: { LLMOSWorkloadList },
};

</script>
<template>
  <LLMOSWorkloadList
    dashboard-name="rayDashboard"
  />
</template>
