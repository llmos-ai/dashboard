<script>
import { getAllSchemaAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';
import ButtonLink from '@shell/components/ButtonLink';

export default {
  layout: 'plain',

  components: { 
    ResourceTable,
    ButtonLink,
  },

  data() {
    return {
      classes: [],
      schema: {
        
      },
      headers: [
        
      ],
    };
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const res = await this.$store.dispatch(
      `${ inStore }/request`,
      { url: getAllSchemaAPI }
    );

    this.classes = res.classes || [];
  },

  computed: {
    createLocation() {
      return {
        name:   `c-cluster-apps-knowledgeBase-create`,
        params: { cluster: 'local' }
      };
    },
  },
};
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">
          Knowledge Base
        </h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <button-link
            :to="createLocation"
          >
            Create
          </button-link>
        </div>
      </div>
    </header>
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="classes"
    />
  </div>
</template>
