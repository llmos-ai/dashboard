<script>
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { allHash } from '@shell/utils/promise';
import { EVENT, NODE } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import jsyaml from 'js-yaml';
import UnitInput from '@shell/components/form/UnitInput.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import DataPool from '@shell/components/DataPool.vue';
import { _VIEW } from '@shell/config/query-params';
import merge from 'lodash/merge';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import { FlatResources } from '@shell/utils/container-resource';
import { cleanUp } from '@shell/utils/object';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';

const TAB_WEIGHT_MAP = {
  basic:      99,
  cluster:    98,
  blockPools: 97,
  filesystem: 96,
  resources:  95,
};

export default {
  name:       'EditCephClusterAddon',
  components: {
    ArrayListGrouped,
    ContainerResourceLimit,
    DataPool,
    KeyValue,
    UnitInput,
    LabeledSelect,
    ResourceTabs,
    Tab,
    NameNsDescription,
    Checkbox,
    LabeledInput,
    ToggleSwitch,
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({
      events: this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }),
      nodes:  this.$store.dispatch(`${ inStore }/findAll`, { type: NODE }),
    });

    // Set default mon and mgr count by node count
    if (this.spec.valuesContent === '') {
      const nodes = hash.nodes.filter((node) => node.isKubeletOk);

      this.valuesContentJson.cephClusterSpec.mon.count = Math.min(3, nodes.length);
      this.valuesContentJson.cephClusterSpec.mgr.count = Math.min(2, nodes.length);
    }
  },

  data() {
    const spec = this.value.spec;
    const metadata = this.value.metadata;
    const enabled = this.$route.query.enabled;

    if (enabled === 'true') {
      this.spec.enabled = true;
    }

    const defaultValuesContentJson = jsyaml.load(spec.defaultValuesContent);

    let valuesContentJson; let copyValuesContentJson = {};

    try {
      if (spec.valuesContent && spec.valuesContent.length > 0) {
        valuesContentJson = jsyaml.load(spec.valuesContent);
      }

      // merge default values with values
      copyValuesContentJson = {
        cephClusterSpec: {
          mon:          defaultValuesContentJson.cephClusterSpec.mon,
          mgr:          defaultValuesContentJson.cephClusterSpec.mgr,
          storage:      defaultValuesContentJson.cephClusterSpec.storage,
          logCollector: defaultValuesContentJson.cephClusterSpec.logCollector,
          resources:    defaultValuesContentJson.cephClusterSpec.resources,
        },
        cephBlockPools:  defaultValuesContentJson.cephBlockPools,
        cephFileSystems: defaultValuesContentJson.cephFileSystems,
      };

      valuesContentJson = merge({}, copyValuesContentJson, valuesContentJson);
    } catch (err) {
      this.$store.dispatch('growl/fromError', {
        title: this.$store.getters['i18n/t']('generic.notification.title.error'),
        err:   err.data || err,
      }, { root: true });
    }

    return {
      spec,
      metadata,
      tabWeightMap: TAB_WEIGHT_MAP,
      defaultValuesContentJson,
      valuesContentJson,
    };
  },

  computed: {
    eventOverride() {
      const events = this.$store.getters[`cluster/all`](EVENT);

      return events.filter((event) => {
        if (event.involvedObject?.uid === this.value?.metadata?.uid) {
          return true;
        }

        if (event.involvedObject?.name.includes(`helm-install-${ this.value.metadata?.name }`)) {
          return true;
        }

        return false;
      }).map((event) => {
        return {
          reason:    (`${ event.reason || this.t('generic.unknown') }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message:   event.message || this.t('generic.unknown'),
          date:      event.lastTimestamp || event.firstTimestamp || event.metadata.creationTimestamp,
          eventType: event.eventType
        };
      });
    },

    options() {
      return [{ label: 'true', value: true }, { label: 'false', value: false }];
    },

    isView() {
      return this.mode === _VIEW;
    },

    containerResourceList() {
      const resources = this.valuesContentJson.cephClusterSpec.resources;
      const resourceList = [];

      for (const key in resources) {
        if (Object.prototype.hasOwnProperty.call(resources, key)) {
          resourceList.push({ name: key, resources: FlatResources.get({ resources: resources[key] }) });
        }
      }

      return resourceList;
    },

    metadataServerResources: {
      get() {
        return FlatResources.get(this.valuesContentJson.cephFileSystems[0].spec.metadataServer);
      },

      set(neu) {
        const out = FlatResources.set(neu);

        this.$set(this.valuesContentJson.cephFileSystems[0].spec.metadataServer, 'resources', cleanUp(out));
      }
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  methods: {
    willSave() {
      const errors = [];

      if (this.spec.chart === '') {
        errors.push(this.t('validation.required', { key: 'Chart Name' }, true));
      }

      if (this.spec.version === '') {
        errors.push(this.t('validation.required', { key: 'Version' }, true));
      }

      if (this.spec.repo === '' ) {
        errors.push(this.t('validation.required', { key: 'Repo' }, true));
      }

      if (!this.validChartRepo(this.spec.repo)) {
        errors.push(this.t('validation.invalidChartRepo', { key: 'Repo' }, true));
      }

      try {
        this.valuesContentJson.cephClusterSpec.resources = this.convertResourceListToObject();
        this.spec.valuesContent = jsyaml.dump(this.valuesContentJson);
      } catch (err) {
        this.$store.dispatch('growl/fromError', {
          title: this.$store.getters['i18n/t']('generic.notification.title.error'),
          err:   err.data || err,
        }, { root: true });
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },

    validChartRepo(url) {
      const pattern = /^(http?|https?|git):\/\/.+$/;

      return pattern.test(url);
    },

    convertResourceListToObject() {
      const arrayList = this.containerResourceList;
      const out = {};

      arrayList.forEach((item) => {
        out[item.name] = FlatResources.set(item.resources);
      });

      return out;
    },
  },

  watch: {
    valuesContentJson: {
      handler(neu) {
        this.$set(this.value.spec, 'valuesContent', jsyaml.dump(neu));
      },
      deep:      true,
      immediate: true
    },
  },
};
</script>

<template>
  <div>
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
    />

    <ResourceTabs
      v-model="value"
      class="mt-15"
      :need-conditions="false"
      :need-related="false"
      :side-tabs="true"
      :eventOverride="eventOverride"
      :useOverrideEvents="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        :label="t('generic.tabs.basic')"
        class="bordered-table"
        :weight="tabWeightMap.basic"
      >
        <h4>Enable Chart</h4>
        <div class="row mb-20">
          <Checkbox
            v-model="spec.enabled"
            label="Enabled"
            :mode="mode"
          />
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model="spec.repo"
              label="Chart Repo"
              required
              :mode="mode"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="spec.chart"
              label="Chart Name"
              required
              :mode="mode"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <labeledInput
              v-model="spec.version"
              label="Version"
              required
              :mode="mode"
            />
          </div>
        </div>
      </Tab>

      <div>
        <Tab
          name="cluster-spec"
          :label="t('ceph.tabs.cluster')"
          class="bordered-table"
          :weight="tabWeightMap.cluster"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                v-model="defaultValuesContentJson.cephClusterSpec.cephVersion.image"
                label="Ceph Image"
                :mode="mode"
                disabled
                required
              />
            </div>

            <div class="col span-6 mb-10">
              <LabeledInput
                v-model="defaultValuesContentJson.cephClusterSpec.dataDirHostPath"
                label="Data Dir Host Path"
                :mode="mode"
                disabled
                required
              />
            </div>
          </div>

          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephClusterSpec.mgr.count"
                label="Manager Replicas"
                :mode="mode"
                :min="1"
                :max="2"
                :hide-unit="true"
                required
              />
            </div>

            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model="valuesContentJson.cephClusterSpec.mgr.allowMultiplePerNode"
                name="label-system-toggle"
                :on-label="t('ceph.labels.multiMgrPerNode')"
              />
            </div>
          </div>

          <h3>Mon Configs</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephClusterSpec.mon.count"
                label="Mon Replicas"
                :mode="mode"
                :min="1"
                :max="3"
                :hide-unit="true"
                required
              />
            </div>
            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model="valuesContentJson.cephClusterSpec.mon.allowMultiplePerNode"
                name="label-system-toggle"
                :on-label="t('ceph.labels.multiMonPerNode')"
              />
            </div>
          </div>

          <!--Storage Configs-->
          <h3>Storage Configs</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model="valuesContentJson.cephClusterSpec.storage.useAllNodes"
                label="Use All Nodes"
                :options="options"
                :mode="mode"
                required
              />
            </div>

            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model="valuesContentJson.cephClusterSpec.storage.useAllDevices"
                label="Use All Devices"
                :options="options"
                :mode="mode"
                required
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledInput
                v-model="valuesContentJson.cephClusterSpec.storage.deviceFilter"
                label="Device Filter"
                placeholder="e.g., ^nvme*"
                :mode="mode"
              />
            </div>
          </div>

          <h3>Log Collector</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <ToggleSwitch
                v-model="valuesContentJson.cephClusterSpec.logCollector.enabled"
                name="label-system-toggle"
                :on-label="t('ceph.labels.enableLogCollector')"
              />
            </div>
          </div>
          <div
            v-if="valuesContentJson.cephClusterSpec.logCollector.enabled"
            class="row"
          >
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephClusterSpec.logCollector.maxLogSize"
                label="Max Log Size"
                :input-exponent="2"
                :placeholder="500"
                :output-modifier="true"
                :mode="mode"
              />
            </div>
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model="valuesContentJson.cephClusterSpec.logCollector.periodicity"
                label="Log Rotation Period"
                :options="['hourly', 'daily', 'weekly', 'monthly']"
                :mode="mode"
              />
            </div>
          </div>
        </Tab>

        <Tab
          name="block-pools"
          :label="t('ceph.tabs.blockPools')"
          class="bordered-table"
          :weight="tabWeightMap.blockPools"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <Checkbox
                v-model="valuesContentJson.cephBlockPools[0].storageClass.isDefault"
                label="Set Block Storage as Default StorageClass"
                :mode="mode"
              />
            </div>
          </div>

          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model="valuesContentJson.cephBlockPools[0].spec.failureDomain"
                label="Failure Domain"
                :options="['host', 'osd']"
                required
                :mode="mode"
              />
            </div>

            <div class="col span-6 mb-10">
              <LabeledInput
                v-model="valuesContentJson.cephBlockPools[0].spec.deviceClass"
                label="Device Class"
                :mode="mode"
              />
            </div>
          </div>

          <!-- Replicated configs -->
          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephBlockPools[0].spec.replicated.size"
                :hide-unit="true"
                label="Replicas Per Failure Domain"
                required
                :mode="mode"
                :min="1"
              />
            </div>
          </div>

          <br>
          <h3>Parameters</h3>
          <KeyValue
            v-model="valuesContentJson.cephBlockPools[0].spec.parameters"
            :add-label="t('storage.addParameters')"
            :read-allowed="false"
            :mode="mode"
          />
        </Tab>

        <Tab
          name="filesystem"
          :label="t('ceph.tabs.filesystem')"
          class="bordered-table"
          :weight="tabWeightMap.filesystem"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <Checkbox
                v-model="valuesContentJson.cephFileSystems[0].preserveFilesystemOnDelete"
                label="Preserve Filesystem On Delete"
                :mode="mode"
                tooltip="Data will be deleted permanently if preserveFilesystemOnDelete is not enabled"
              />
            </div>

            <div class="col span-6 mb-10">
              <Checkbox
                v-model="valuesContentJson.cephFileSystems[0].storageClass.isDefault"
                label="Set FS as Default StorageClass"
                :mode="mode"
              />
            </div>
          </div>

          <h3>Data Pool</h3>
          <div>
            <DataPool
              :data="valuesContentJson.cephFileSystems[0].spec.dataPools[0]"
              :show-name="false"
              :isView="isView"
            />
          </div>

          <h3>Metadata Pool</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephFileSystems[0].spec.metadataPool.replicated.size"
                :hide-unit="true"
                label="Replicas Per Failure Domain"
                required
                :min="1"
                :mode="mode"
              />
            </div>
          </div>

          <br>
          <h3>Metadata Server</h3>
          <div class="row">
            <div class="col span-6 mb-10">
              <UnitInput
                v-model="valuesContentJson.cephFileSystems[0].spec.metadataServer.activeCount"
                :hide-unit="true"
                label="Active Count"
                :min="1"
                required
                :mode="mode"
              />
            </div>
            <div class="col span-6 mb-10">
              <Checkbox
                v-model="valuesContentJson.cephFileSystems[0].spec.metadataServer.activeStandby"
                label="Enable Active Standby"
                :mode="mode"
              />
            </div>
          </div>

          <div class="mb-20">
            <ContainerResourceLimit
              v-model="metadataServerResources"
              :pod-spec="valuesContentJson.cephFileSystems[0].spec.metadataServer.spec"
              :mode="mode"
              :show-tip="false"
            />
          </div>
        </Tab>

        <Tab
          name="resources"
          :label="t('ceph.tabs.resources')"
          class="bordered-table"
          :weight="tabWeightMap.resources"
        >
          <ArrayListGrouped
            :value="containerResourceList"
            class="mb-20"
            :mode="mode"
            :can-add="false"
            :can-remove="false"
          >
            <template #default="props">
              <span class="row ceph-resource-title">{{ t(`ceph.name.${props.row.value.name}`) }}</span>
              <div class="mb-20">
                <ContainerResourceLimit
                  v-model="props.row.value.resources"
                  :mode="mode"
                  :show-tip="false"
                />
              </div>
            </template>
          </ArrayListGrouped>
        </Tab>
      </div>
    </ResourceTabs>
  </div>
</template>

<style lang="scss">
.ceph-resource-title {
  font: caption;
  padding: 0 0 5px 0;
}
</style>
