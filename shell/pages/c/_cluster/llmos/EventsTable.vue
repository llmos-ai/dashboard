<script>
import SortableTable from '@shell/components/SortableTable';
import { MESSAGE, NAME, OBJECT, REASON } from '@shell/config/table-headers';
import { EVENT } from '@shell/config/types';
import { fetchClusterResources } from './llmos-utils';

export default {
  components: { SortableTable },

  async fetch() {
    const events = await fetchClusterResources(this.$store, EVENT);

    this.events = events.filter((e) => e._type === 'Warning');
  },

  data() {
    const reason = {
      ...REASON,
      ...{ canBeVariable: true },
      width: 130,
    };

    const eventHeaders = [
      reason,
      OBJECT,
      MESSAGE,
      NAME,
      {
        name:        'date',
        label:       'Date',
        labelKey:    'clusterIndexPage.sections.events.date.label',
        value:       'timestamp',
        sort:        'timestamp:desc',
        formatter:   'Date',
        width:       220,
        defaultSort: true,
      },
    ];

    return {
      events: [],
      eventHeaders,
    };
  },

  mounted() {
    this.dismissRouteHandler = this.$router.beforeEach(this.onRouteChange);
  },

  methods: {
    async onRouteChange(to, from, next) {
      if (this.$route.name !== to.name) {
        await this.$store.dispatch('cluster/forgetType', EVENT);
      }

      next();
    }
  },

  beforeUnmount() {
    this.dismissRouteHandler();
  }
};
</script>

<template>
  <SortableTable
    :loading="$fetchState.pending"
    :rows="events"
    :headers="eventHeaders"
    key-field="id"
    :search="false"
    :table-actions="false"
    :row-actions="false"
    :paging="true"
    :rows-per-page="10"
    default-sort-by="date"
  />
</template>
