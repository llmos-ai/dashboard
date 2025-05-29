<script>
import { getAllSchemaAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  layout: 'plain',

  components: { ResourceTable },

  data() {
    return {
      className: '',
      classes: [],
      schema: {},
    };
  },

  async fetch() {

  },

  methods: {
    async onCreate() {
      if (!this.className) {
        this.$message.error('请输入表名');
        return;
      }

      const inStore = this.$store.getters['currentProduct'].inStore;
      try {
        await this.$store.dispatch(
          `${inStore}/request`,
          {
            url: getAllSchemaAPI,
            method: 'POST',
            data: {
              class: this.className,
              description: '知识库集合',
              vectorizer: 'none',
              vectorIndexType: 'hnsw',
              vectorIndexConfig: {
                distance: 'cosine',
                efConstruction: 200,
                maxConnections: 64
              },
              properties: [
                {
                  name: 'text',
                  description: '文本内容',
                  dataType: ['text'],
                  tokenization: 'word',
                  indexFilterable: true,
                  indexSearchable: true
                }
              ]
            }
          }
        );
        this.$message.success('创建成功');
      } catch (error) {
        this.$message.error('创建失败：' + error.message);
      }
    }
  }
};
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">创建知识库</h1>
      </div>
    </header>

    <div class="mt-4">
      <a-form-item label="表名">
        <a-input
          v-model:value="className"
          placeholder="请输入表名"
          class="w-64"
        />
      </a-form-item>

      <a-button
        type="primary"
        :disabled="!className"
        @click="onCreate"
      >
        创建
      </a-button>
    </div>
  </div>
</template>
