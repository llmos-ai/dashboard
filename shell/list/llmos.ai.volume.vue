<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { SCHEMA, LLMOS, PV, PVC } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { STATE, NAME, AGE, NAMESPACE } from '@shell/config/table-headers';

const schema = {
  id:         LLMOS.VOLUME,
  type:       SCHEMA,
  attributes: {
    kind:       LLMOS.VOLUME,
    namespaced: true
  },
  metadata: { name: LLMOS.VOLUME },
};

export default {
  name:       'LLMOSVolumes',
  components: { Loading, ResourceTable },
  mixins:     [ResourceFetch],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const hash = await allHash({
      pvcs: this.$store.dispatch(`${ inStore }/findAll`, { type: PVC }),
      pvs:  this.$store.dispatch(`${ inStore }/findAll`, { type: PV }),
    });

    this.pvcs = hash.pvcs;
  },

  data() {
    return { pvcs: [] };
  },

  computed: {
    schema() {
      return schema;
    },

    headers() {
      const STORAGE_CLASS = {
        labelKey: 'tableHeaders.storageClass',
        name:     'storageClass',
        sort:     ['storageClass'],
        value:    'spec.storageClassName',
      };
      const VOLUME_MODE = {
        labelKey: 'tableHeaders.volumeMode',
        name:     'volumeMode',
        sort:     ['volumeMode'],
        value:    'spec.volumeMode',
      };
      const CAPACITY = {
        labelKey: 'tableHeaders.capacity',
        name:     'capacity',
        sort:     ['capacity'],
        value:    'spec.resources.requests.storage',
      };

      return [
        STATE,
        NAME,
        NAMESPACE,
        CAPACITY,
        STORAGE_CLASS,
        VOLUME_MODE,
        AGE,
      ];
    },
  },

  methods: {},

  typeDisplay() {
    return this.$store.getters['type-map/labelFor'](schema, 99);
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :headers="headers"
    :loading="loading"
    :groupable="true"
    default-sort-by="age"
    :namespaced="true"
    :rows="pvcs"
    :schema="schema"
    key-field="_key"
  />
</template>
