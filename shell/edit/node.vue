<script>
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import createEditView from '@shell/mixins/create-edit-view';
import Labels from '@shell/components/form/Labels.vue';
import Taints from '@shell/components/form/Taints.vue';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import NodeImportCommand from '@shell/components/NodeImportCommand.vue';

export default {
  components: {
    NodeImportCommand,
    CruResource,
    Labels,
    NameNsDescription,
    ResourceTabs,
    Tab,
    Taints,
  },

  mixins: [createEditView],

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    },
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },
};
</script>

<template>
  <div>
    <div v-if="isCreate">
      <NodeImportCommand :value="value" />
      <slot name="actions">
        <a-button
          class="pull-right"
          type="primary"
          @click="done"
        >
          {{ t('generic.done') }}
        </a-button>
      </slot>
    </div>
    <CruResource
      v-else
      :mode="mode"
      :resource="value"
      :subtypes="[]"
      :validation-passed="true"
      :errors="errors"
      :apply-hooks="applyHooks"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription
        :value="value"
        :namespaced="false"
        :mode="mode"
      />
      <ResourceTabs
        :value="value"
        :mode="mode"
      >
        <Tab
          name="taints"
          :label="t('node.detail.tab.taints')"
          :weight="0"
        >
          <Taints
            v-model:value="value.spec.taints"
            :mode="mode"
          />
        </Tab>
        <Tab
          name="labels-and-annotations"
          label-key="generic.labelsAndAnnotations"
          :weight="-1"
        >
          <Labels
            default-container-class="labels-and-annotations-container"
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
          />
        </Tab>
      </ResourceTabs>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped></style>
