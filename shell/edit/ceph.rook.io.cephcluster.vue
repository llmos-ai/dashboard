<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import CephConfig from '@shell/mixins/ceph-config';
import { Banner } from '@components/Banner';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import UnitInput from '@shell/components/form/UnitInput.vue';

const TAB_WEIGHT_MAP = {
  basic:        99,
  logCollector: 98,
};

export default {
  name:       'CephCluster',
  components: {
    UnitInput,
    LabeledInput,
    Banner,
    LabeledSelect,
    ResourceTabs,
    Tab,
    CruResource,
    NameNsDescription,
    ToggleSwitch,
  },
  mixins: [CreateEditView, FormValidation, CephConfig],
  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
  data() {
    const spec = this.value.spec;

    return {
      spec,
      tabWeightMap: TAB_WEIGHT_MAP,
    };
  },
};
</script>

<template>
  <form class="filled-height">
    <Banner
      v-if="isLLMOSRelease"
      color="info"
      class="mb-20"
      :inner-html="managedWarning"
    />
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="fvFormIsValid"
      :errors="fvUnreportedValidationErrors"
      :apply-hooks="applyHooks"
      @finish="save"
    >
      <NameNsDescription
        :value="value"
        :namespaced="true"
        :mode="mode"
      />

      <ResourceTabs
        :value="value"
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
          :weight="tabWeightMap.basic"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                v-model:value="spec.cephVersion.image"
                label="Ceph Image"
                :mode="mode"
                required
              />
            </div>

            <div class="col span-6 mb-10">
              <LabeledInput
                v-model:value="spec.dataDirHostPath"
                label="Data Dir Host Path"
                :mode="mode"
                required
              />
            </div>
          </div>

          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model:value="spec.mgr.count"
                label="Manager Replicas"
                :mode="mode"
                :min="1"
                :hide-unit="true"
                required
              />
            </div>

            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model:value="spec.mgr.allowMultiplePerNode"
                name="label-system-toggle"
                :on-label="t('ceph.labels.multiMgrPerNode')"
              />
            </div>
          </div>

          <h3>Mon Configs</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model:value="spec.mon.count"
                label="Mon Replicas"
                :mode="mode"
                :min="1"
                :hide-unit="true"
                required
              />
            </div>
            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model:value="spec.mon.allowMultiplePerNode"
                name="label-system-toggle"
                :disabled="isView"
                :on-label="t('ceph.labels.multiMonPerNode')"
              />
            </div>
          </div>

          <!--Storage Configs-->
          <h3>Storage Configs</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model:value="spec.storage.useAllNodes"
                label="Use All Nodes"
                :options="options"
                :mode="mode"
              />
            </div>

            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model:value="spec.storage.useAllDevices"
                label="Use All Devices"
                :options="options"
                :mode="mode"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                v-model:value="spec.storage.deviceFilter"
                label="Device Filter"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>

        <!-- Log Collector Tab-->
        <Tab
          name="logCollector"
          :label="t('ceph.tabs.log')"
          class="bordered-table"
          :weight="tabWeightMap.logCollector"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model:value="spec.logCollector.enabled"
                name="label-system-toggle"
                :on-label="t('ceph.labels.enableLogCollector')"
              />
            </div>
          </div>
          <div
            v-if="spec.logCollector.enabled"
            class="row"
          >
            <div
              v-if="spec.logCollector.enabled"
              class="col span-6 mb-10"
            >
              <UnitInput
                v-model:value="spec.logCollector.maxLogSize"
                label="Max Log Size"
                :input-exponent="2"
                :placeholder="500"
                :output-modifier="true"
                :mode="mode"
              />
            </div>
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model:value="spec.logCollector.periodicity"
                label="Log Rotation Period"
                :options="['hourly', 'daily', 'weekly', 'monthly']"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>
      </ResourceTabs>
    </CruResource>
  </form>
</template>
