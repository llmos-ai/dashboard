<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import DetailText from '@shell/components/DetailText';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import FileList from './FileList'

import CreateEditView from '@shell/mixins/create-edit-view';
import { LLMOS } from '@shell/config/types';

import { allHash } from '@shell/utils/promise';

export default {
  components: {
    ResourceTabs,
    DetailText,
    Tab,
    Loading,
    FileList,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {
      files: [],
      loading: false,
      datasetVersions: [],
    };
  },  

  async fetch() {
    await this.fetchFiles();
  },

  computed: {
    datasetVersionOptions() {
      return this.datasetVersions.map(d => ({
        label: d.spec.version,
        value: d.id,
      }));
    },
  },

  methods: {
    async fetchFiles(targetFilePath) {
      this.loading = true;

      const inStore = this.$store.getters['currentProduct'].inStore;
      const res = await this.$store.dispatch(`${inStore}/findAll`, { type: LLMOS.DATASET_VERSION });
      
      const datasetVersions = (res || []).filter(d => (d?.status?.rootPath || '').includes(`datasets/${this.value.id}`));
      this.datasetVersions = datasetVersions;      

      const hash = await allHash({
        files: datasetVersions[0].doAction('list', {
          targetFilePath,
        }),
      });

      this.loading = false;

      const files = hash.files || [];

      this.files = files.sort((a, b) => {
        if (a.Size === 0 && b.Size !== 0) {
          return -1;
        }
        if (a.Size !== 0 && b.Size === 0) {
          return 1;
        }

        return a.Name.localeCompare(b.Name);
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs 
    v-else
    :value="value"
    :needConditions="false"
    :needEvents="false"
    :needRelated="false"
  >
    <Tab
      name="files"
      label="Files"
    >
      <a-spin :spinning="loading">
        <FileList 
          :files="files"
          :resource="value"
          @fetchFiles="fetchFiles"
        />
      </a-spin>
    </Tab>
  </ResourceTabs>
</template>
