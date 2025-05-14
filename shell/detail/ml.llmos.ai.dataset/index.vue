<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import DetailText from '@shell/components/DetailText';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import FileList from './FileList';

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
      files:           [],
      loading:         false,
      datasetVersions: [],
      datasetVersion:  {},
    };
  },

  async fetch() {
    await this.fetchFiles();
  },

  computed: {
    datasetVersionOptions() {
      return this.datasetVersions.map((d) => ({
        label: d.spec.version,
        value: d.id,
      }));
    },
  },

  methods: {
    async fetchFiles(targetFilePath, version) {
      this.loading = true;

      const inStore = this.$store.getters['currentProduct'].inStore;

      await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET_VERSION });

      const datasetVersions = this.value.datasetVersions;

      this.datasetVersions = datasetVersions;

      let datasetVersion = this.datasetVersion?.id ? this.datasetVersion : datasetVersions[0];

      if (version) {
        datasetVersion = datasetVersions.filter((d) => d.spec.version === version)[0];
      }

      if (!datasetVersion.id) {
        this.loading = false;

        this.$message.error('Version not found');

        return;
      } else {
        this.datasetVersion = datasetVersion;
      }

      const hash = await allHash({ files: datasetVersion.doAction('list', { targetFilePath }) });

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
          :datasetVersions="datasetVersions"
          :datasetVersion="datasetVersion"
          @fetchFiles="fetchFiles"
        />
      </a-spin>
    </Tab>
  </ResourceTabs>
</template>
