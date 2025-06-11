<script>
import { groupBy } from 'lodash';

import { getAllSchemaAPI, getAllObjectAPI } from '@/shell/config/weaviate';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import CreateEditView from '@shell/mixins/create-edit-view';

import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';

import { NAME } from '@shell/config/table-headers';

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
      classes: [],
      objects: [],
    };
  },

  async fetch() {
    const hash = await allHash({
      classes: this.$store.dispatch(
        `${ this.inStore }/request`,
        { url: getAllSchemaAPI }
      ),
      objects: this.$store.dispatch(
        `${ this.inStore }/request`,
        { url: getAllObjectAPI }
      ),
    });

    this.classes = hash.classes.classes || [];
    this.objects = hash.objects.objects || [];
  },

  computed: {
    rows() {
      const id = this.$route.params.id;
      const namespace = this.$route.params.namespace;

      const out = this.value?.status?.parsedFiles || [];

      const map = groupBy(out, 'file.name');

      return Object.keys(map).map((key) => {
        return {
          name:           key,
          id:             key,
          detailLocation: {
            name:   `c-cluster-product-resource-namespace-class-document-id`,
            params: {
              cluster: 'local',
              product: 'apps',
              namespace,
              class:   id,
              id:      key,
            },
          },
          parsedFile: map[key],
        };
      });
    },

    headers() {
      return [
        {
          ...NAME,
          value: 'name',
        },
        {
          name:  '分段模式',
          label: '分段模式',
          value: '分段模式',
        },
        {
          name:  '字符数',
          label: '字符数',
          value: '字符数',
        },
      ];
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
      :label="t('knowledgeBase.tabs.documents')"
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
