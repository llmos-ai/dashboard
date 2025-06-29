<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import FileList from './FileList';

import CreateEditView from '@shell/mixins/create-edit-view';

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
    return { loading: false };
  },

  computed: {
    files() {
      return (this.value?.status?.files || []).map((f) => {
        return {
          ...f,
          ...(f.sourceFile || {}),
        };
      });
    }
  },

  methods: {
    async fetchFiles(targetFilePath) {

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
      label="文件"
    >
      <a-spin :spinning="loading">
        <FileList
          :files="files"
          :resource="value"
          :hasFolder="false"
          @fetchFiles="fetchFiles"
        />
      </a-spin>
    </Tab>
  </ResourceTabs>
</template>
