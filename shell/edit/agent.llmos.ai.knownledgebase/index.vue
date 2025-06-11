<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FileList from '@shell/detail/agent.llmos.ai.datacollection/FileList';

import { ML_WORKLOAD_TYPES, APP } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'Dataset',

  components: {
    CruResource,
    NameNsDescription,
    Tab,
    LabeledSelect,
    ResourceTabs,
    FileList,
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({
      models:      this.$store.dispatch(`${ inStore }/findAll`, { type: ML_WORKLOAD_TYPES.MODEL_SERVICE }),
      dataCenters: this.$store.dispatch(`${ inStore }/findAll`, { type: APP.APPLICATION_DATA }),
    });
  },

  data() {
    const resource = { spec: { files: [] } };

    Object.assign(resource, this.value);

    const step = this.$route.query.step;

    return {
      errors:     [],
      registries: [],
      resource,
      current:    step ? Number(step) : 0,
      items:      [
        { title: this.t('generic.tabs.basic') },
        { title: this.t('knowledgeBase.steps.selectData') },
      ],
      checkedFiles:       [],
      selectedDataCenter: '',
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {

    validationPassed() {
      return (
        !!this.value.metadata.name &&
        !!this.resource.spec?.embeddingModel &&
        !!this.checkedFiles.length > 0
      );
    },

    modelOptions() {
      const models = this.$store.getters[`${ this.inStore }/all`](ML_WORKLOAD_TYPES.MODEL_SERVICE);

      const out = models.filter((model) => model.isRunning).map((m) => ({
        label: m.id,
        value: m.id,
      }));

      return out;
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    disableNext() {
      return (
        !this.value.metadata.name ||
        !this.resource.spec?.embeddingModel
      );
    },

    dataCenterOptions() {
      const dataCenters = this.$store.getters[`${ this.inStore }/all`](APP.APPLICATION_DATA);

      return dataCenters.map((dc) => ({
        label: dc.metadata.name,
        value: dc.metadata.name,
      }));
    },

    files() {
      const dataCenter = this.$store.getters[`${ this.inStore }/byId`](APP.APPLICATION_DATA, `default/${this.selectedDataCenter}`) || {};

      const out = (dataCenter?.status?.preprocessedFiles || []).map((f) => {
        return {
          ...f,
          ...(f.sourceFile || {}),
        };
      });

      return out;
    },
  },

  methods: {
    willSave() {
      Object.assign(this.value, this.resource);

      const checkedFiles = this.checkedFiles.map((f) => {
        return {
          dataCollectionName: f.dataCollectionName,
          uid:                 f.uid,
        };
      });

      if (this.mode === 'edit') {
        this.value.spec.files = this.value.spec.files.concat(checkedFiles);
      } else {
        this.value.spec.files = checkedFiles;
      }
    },

    next() {
      this.current++;
    },

    prev() {
      this.current--;
    },

    onFileChecked(fileList) {
      const uidArr = this.checkedFiles.map((f) => f.uid);
      const newArr = fileList.filter((f) => {
        return !uidArr.includes(f.uid);
      });

      this.checkedFiles = [
        ...this.checkedFiles, 
        ...newArr.map(a => {
          return {
            ...a,
            dataCollectionName: this.selectedDataCenter,
          }
        }),
      ];
    },
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    :validation-passed="validationPassed"
    @finish="save"
  >
    <a-steps
      v-if="isCreate"
      :current="current"
      :items="items"
      class="mb-10"
      size="small"
    />

    <div v-if="current === 0">
      <NameNsDescription
        :value="value"
        :namespaced="true"
        :mode="mode"
        descriptionHidden
      />

      <ResourceTabs
        :value="value"
        class="mt-15"
        :need-conditions="true"
        :need-events="false"
        :need-related="false"
        :side-tabs="true"
        :mode="mode"
      >
        <Tab
          name="basic"
          :label="t('generic.tabs.basic')"
          :weight="2"
        >
          <div class="row mb-10">
            <div class="col span-12">
              <LabeledSelect
                v-model:value="resource.spec.embeddingModel"
                :options="modelOptions"
                :mode="mode"
                :multiple="false"
                label-key="knowledgeBase.embeddingModel.label"
                required
              />
            </div>
          </div>
        </Tab>
      </ResourceTabs>
    </div>

    <div v-if="current === 1">
      <div class="row">
        <div class="col span-12">
          <div class="file-select-panel">
            <div class="panel-header">
              {{ t('knowledgeBase.dataCenter.label') }}
              :
              <a-select
                v-model:value="selectedDataCenter"
                style="width: 200px"
                :options="dataCenterOptions"
                class="ml-10"
                placeholder="Select Data Center"
                @change="onDataCenterChange"
              />
            </div>
            <div class="panel-content">
              <FileList
                :files="files"
                :resource="value"
                :hasFolder="false"
                mode="view"
                :showHeader="false"
                @fetchFiles="fetchFiles"
                @checked="onFileChecked"
                :checkedFiles="checkedFiles"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #createBtnPrefix>
      <div
        v-if="isCreate"
        class="inline-block"
      >
        <a-button
          v-if="current === 0"
          type="primary"
          :disabled="disableNext"
          @click="next"
        >
          {{ t('generic.next') }}
        </a-button>

        <a-button
          v-if="current === 1"
          @click="prev"
        >
          {{ t('generic.previous') }}
        </a-button>
      </div>
    </template>
  </CruResource>
</template>

<style scoped>
.file-selection-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  height: 600px;
}

.file-list-panel,
.selected-files-panel {
  height: 100%;
}
</style>

<style lang="scss" scoped>
.file-select-panel,
.selected-files-panel {
  height: 100%;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);

  .panel-header {
    padding: 15px;
    border-bottom: 1px solid var(--border);

    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .panel-content {
    padding: 15px;
    height: 100%;
    overflow-y: auto;
  }
}
</style>
