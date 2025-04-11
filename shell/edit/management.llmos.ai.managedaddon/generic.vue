<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { Checkbox } from '@shell/components/form/Checkbox';
import YamlEditor from '@shell/components/YamlEditor.vue';
import ManagedAddonMixin from '@shell/edit/management.llmos.ai.managedaddon/mixin/addon';

export default {
  name:       'EditGenericAddon',
  components: {
    ResourceTabs,
    Tab,
    NameNsDescription,
    YamlEditor,
    Checkbox,
    LabeledInput,
  },
  mixins: [ManagedAddonMixin],
  data() {
    const spec = this.value.spec;
    const enabled = this.$route.query.enabled;

    if (enabled !== undefined) {
      spec.enabled = enabled.toString() === 'true';
    }

    if (!spec.valuesContent && spec.defaultValuesContent?.length > 0) {
      spec.valuesContent = spec.defaultValuesContent;
    }

    return { spec };
  }
};
</script>

<template>
  <div>
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
      :description-disabled="!allowEdit"
    />

    <ResourceTabs
      v-model:value="value"
      class="mt-15"
      :need-conditions="false"
      :need-related="false"
      :side-tabs="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        :label="t('generic.tabs.basic')"
        class="bordered-table"
      >
        <h4>Enable Chart</h4>
        <div class="row mb-20">
          <Checkbox
            v-model:value="spec.enabled"
            label="Enabled"
            :mode="mode"
          />
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model:value="spec.repo"
              label="Chart Repo"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model:value="spec.chart"
              label="Chart Name"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model:value="spec.version"
              label="Version"
              required
              :disabled="!allowEdit"
              :mode="mode"
            />
          </div>
        </div>

        <div>
          <h4>Values</h4>
          <div class="row mb-20">
            <div class="col span-12">
              <YamlEditor
                v-model:value="spec.valuesContent"
                :value="spec.valuesContent"
                :mode="mode"
                class="yaml-editor"
              />
            </div>
          </div>
        </div>
      </Tab>
    </ResourceTabs>
  </div>
</template>
