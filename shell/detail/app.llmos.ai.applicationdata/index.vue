<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import FileList from '@shell/detail/ml.llmos.ai.model/FileList';

import CreateEditView from '@shell/mixins/create-edit-view';

import { allHash } from '@shell/utils/promise';

export default {
  components: {
    ResourceTabs,
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
      loading: false,
    };
  },

  computed: {
    files() {
      return (this.value?.status?.preprocessedFiles || []).map(f => {
        return {
          ...f,
          ...(f.sourceFile || {}),
        }
      });
    }
  },

  methods: {
    async fetchFiles(targetFilePath) {
      console.log('fetchFiles', targetFilePath);
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
          :hasFolder="false"
        />
      </a-spin>
    </Tab>
  </ResourceTabs>
</template>
