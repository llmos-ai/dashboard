<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE } from '@shell/config/table-headers';
import { SERVICE, LLMOS } from '@shell/config/types';

export default {
  name: 'NoteBooksList',

  components: { ResourceTable, Loading },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = {
      notebooks: this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.NOTEBOOK }),
      services:  this.$store.dispatch(`${ inStore }/findAll`, { type: SERVICE })
    };

    const res = await allHash(hash);

    this.rows = res.notebooks;
  },

  data() {
    return { rows: [] };
  },

  computed: {
    headers() {
      const TYPE = {
        name:      'type',
        label:     'Type',
        sort:      ['notebookType'],
        value:     'notebookType',
        formatter: 'ProductTypeIcon',
      };

      const CONNECT = {
        name:      'connect',
        label:     'Connect',
        sort:      ['connect'],
        formatter: 'Connect',
        value:     'connectUrl'
      };

      const CPUS_LIMIT = {
        name:  'cpusRequest',
        label: 'CPU',
        sort:  ['cpusRequest'],
        value: 'cpusRequest'
      };

      const MEMORY_LIMIT = {
        name:  'memoryRequest',
        label: 'Memory',
        sort:  ['memoryRequest'],
        value: 'memoryRequest'
      };

      const headers = [
        STATE,
        NAME,
        CONNECT,
        TYPE,
        CPUS_LIMIT,
        MEMORY_LIMIT,
        AGE
      ];

      return headers;
    },
  }
};

</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :groupable="true"
    :rows="rows"
    key-field="_key"
    v-on="$listeners"
  />
</template>
