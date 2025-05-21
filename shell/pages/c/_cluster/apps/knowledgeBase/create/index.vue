<script>
import { getAllSchemaAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  layout: 'plain',

  components: { ResourceTable },

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
        name:   `c-cluster-app-knowledgeBase-create`,
      };
    },
  },

  methods: {
    async onCreate() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const res = await this.$store.dispatch(
        `${ inStore }/request`,
        { 
          url: getAllSchemaAPI,
          method: 'POST',
          data: {
            "class": 'qy-dev',
            "description": "A collection for product information",
            "vectorizer": "none",
            "vectorIndexType": "hnsw",
            "vectorIndexConfig": {
              "distance": "cosine",
              "efConstruction": 200,
              "maxConnections": 64
            },
            "properties": [
                {
                    "name": "text",
                    "description": "The text content",
                    "dataType": ["text"],
                    "tokenization": "word",
                    "indexFilterable": true,
                    "indexSearchable": true
                }
            ]
          }
        }
      );
    }
  }
};
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">
          Knowledge Base Create
        </h1>
      </div>
    </header>

    <a-button
      type="primary"
      @click="onCreate"
    >
      Create
    </a-button>
  </div>
</template>
