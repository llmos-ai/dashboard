<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import DetailText from '@shell/components/DetailText';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import FileList from './FileList';

import CreateEditView from '@shell/mixins/create-edit-view';

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
      files:   [],
      loading: false,
    };
  },

  async fetch() {
    await this.fetchFiles();
  },

  computed: {},

  methods: {
    async fetchFiles(targetFilePath) {
      const inStore = this.$store.getters['currentProduct'].inStore;

      this.loading = true;

      const hash = await allHash({ files: this.value.doAction('list', { targetFilePath }) });

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
