<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'APIKeyCreate',
  layout:     'plain',
  components: { ResourceDetail },
};
</script>

<template>
  <div>
    <ResourceDetail
      store-override="management"
      resource-override="management.llmos.ai.token"
      parent-route-override="account"
    />
  </div>
</template>
