<script>
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import CreateEditView from '@shell/mixins/create-edit-view';

import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

import { NAME, STATE, AGE, STORAGE_CLASS_DEFAULT } from '@shell/config/table-headers';

export default {
  components: {
    ResourceTabs,
    Tab,
    Loading,
    ResourceTable,
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
    await allHash({ localModelVersions: this.$store.dispatch(`${ this.inStore }/findAll`, { type: LLMOS.LOCAL_MODEL_VERSION }) });
  },

  computed: {
    headers() {
      const VOLUME_SNAPSHOT = {
        name:  'status.volumeSnapshot',
        label: this.t('localModel.volumeSnapshot.label')
      };

      const headers = [
        STATE,
        NAME,
        VOLUME_SNAPSHOT,
        STORAGE_CLASS_DEFAULT,
        AGE,
      ];

      return headers;
    },

    rows() {
      return this.value.localModelVersions;
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](LLMOS.LOCAL_MODEL_VERSION);
    },
  },

  methods: {}
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
      label="Versions"
    >
      <ResourceTable
        :loading="loading"
        :schema="schema"
        :rows="rows"
        :headers="headers"
        default-sort-by="age"
      />
    </Tab>
  </ResourceTabs>
</template>
