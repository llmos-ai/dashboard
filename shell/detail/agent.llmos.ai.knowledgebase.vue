<script>
import { groupBy } from 'lodash';

import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import CreateEditView from '@shell/mixins/create-edit-view';

import { NAME } from '@shell/config/table-headers';

export default {
  components: {
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

  },

  computed: {
    rows() {
      const id = this.$route.params.id;
      const namespace = this.$route.params.namespace;

      const out = this.value?.status?.importedFiles || [];

      const map = groupBy(out, 'uid');

      return Object.keys(map).map((key) => {
        const parsedFile = map[key]?.[0];

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
          parsedFile,
        };
      });
    },

    headers() {
      return [
        {
          ...NAME,
          value: 'parsedFile.file.name',
        },
      ];
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },
  },

  methods: {}
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    :loading="loading"
    :schema="schema"
    :rows="rows"
    :headers="headers"
    default-sort-by="age"
    :groupable="false"
  />
</template>
