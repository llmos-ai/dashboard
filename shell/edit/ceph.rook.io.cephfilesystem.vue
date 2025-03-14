<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CruResource from '@shell/components/CruResource.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { cleanUp, set } from '@shell/utils/object';
import { REPLICATED, ERASURE_CODED } from '@shell/edit/ceph.rook.io.cephblockpool.vue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';
import DataPool from '@shell/components/DataPool.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit.vue';
import CephConfig from '@shell/mixins/ceph-config';

export const DEFAULT_DATA_POOL = {
  name:          '',
  failureDomain: 'host',
  replicated:    { size: 3 },
  erasureCoded:  {
    dataChunks:   0,
    codingChunks: 0
  }
};

export default {
  name:       'CephBlockPool',
  components: {
    ContainerResourceLimit,
    DataPool,
    ArrayListGrouped,
    Checkbox,
    UnitInput,
    ResourceTabs,
    Tab,
    CruResource,
    NameNsDescription,
    Banner,
  },
  mixins: [CreateEditView, FormValidation, CephConfig],
  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:        String,
      default:     'create',
      typeOptions: [REPLICATED, ERASURE_CODED],
    },
  },
  data() {
    const spec = this.value.spec;

    return {
      spec,
      REPLICATED,
      ERASURE_CODED,
      defaultDataPool: DEFAULT_DATA_POOL,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    flatResources: {
      get() {
        const { limits = {}, requests = {} } = this.spec.metadataServer.resources || {};
        const {
          cpu: limitsCpu,
          memory: limitsMemory,
        } = limits;
        const { cpu: requestsCpu, memory: requestsMemory } = requests;

        return {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
        };
      },
      set(neu) {
        const {
          limitsCpu,
          limitsMemory,
          requestsCpu,
          requestsMemory,
        } = neu;

        const out = {
          requests: {
            cpu:    requestsCpu,
            memory: requestsMemory,
          },
          limits: {
            cpu:    limitsCpu,
            memory: limitsMemory,
          },
        };

        this.spec.metadataServer['resources'] = cleanUp(out);
      },
    },
  },

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.type === ERASURE_CODED) {
        set(this, 'spec.replicated', null);
      } else {
        set(this, 'spec.erasureCoded', null);
      }
    },

    update() {
      if (this.type === ERASURE_CODED && !this.spec.erasureCoded) {
        this.spec.erasureCoded = {
          dataChunks:   2,
          codingChunks: 1
        };
      }
    },

    removeDataPool(pool) {
      this.spec.dataPools = this.spec.dataPools.filter((p) => {
        return p.name !== pool.row.value.name;
      });
    }
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="isLLMOSRelease"
      color="info"
      class="mb-20"
      :inner-html="managedWarning"
    />

    <form class="filled-height">
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
          v-model:value="value"
          class="mt-15"
          :need-conditions="false"
          :need-related="false"
          :side-tabs="true"
          :mode="mode"
        >
          <Tab
            name="data-pools"
            label="Data Pools"
            class="bordered-table"
          >
            <div class="row">
              <div class="col span-6 mb-10">
                <Checkbox
                  v-model:value="spec.preserveFilesystemOnDelete"
                  label="Preserve Filesystem On Delete"
                  :mode="mode"
                  tooltip="Data will be deleted permanently if preserveFilesystemOnDelete is not enabled"
                  @update:value="update"
                />
              </div>
            </div>

            <ArrayListGrouped
              v-model:value="spec.dataPools"
              class="mb-20"
              :mode="mode"
              :default-add-value="{ ...defaultDataPool }"
              add-label="Add Data Pool"
              :can-add="true"
              @remove="removeDataPool"
            >
              <template #default="props">
                <DataPool
                  :data="props.row.value"
                  :isView="isView"
                />
              </template>
            </ArrayListGrouped>
          </Tab>

          <Tab
            name="metadata-settings"
            label="Metadata Pool"
            class="bordered-table"
          >
            <div class="row">
              <div class="col span-6 mb-10">
                <UnitInput
                  v-model:value="spec.metadataPool.replicated.size"
                  :hide-unit="true"
                  label="Replicas Per Failure Domain"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>
            </div>

            <br>
            <h3>Metadata Server</h3>
            <div class="row">
              <div class="col span-6 mb-10">
                <UnitInput
                  v-model:value="spec.metadataServer.activeCount"
                  :hide-unit="true"
                  label="Active Count"
                  required
                  :mode="mode"
                  @update:value="update"
                />
              </div>
              <div class="col span-6 mb-10">
                <Checkbox
                  v-model:value="spec.metadataServer.activeStandby"
                  label="Enable Active Standby"
                  :mode="mode"
                  @update:value="update"
                />
              </div>
            </div>

            <div class="mb-20">
              <ContainerResourceLimit
                v-model:value="flatResources"
                :mode="mode"
                :show-tip="false"
                :handle-gpu-limit="false"
                @update:value="update"
              />
            </div>
          </Tab>
        </ResourceTabs>
      </CruResource>
    </form>
  </div>
</template>
