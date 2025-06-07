<script>
import { getAllSchemaAPI, getAllObjectAPI } from '@/shell/config/weaviate';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import CruResourceFooter from '@shell/components/CruResourceFooter';
import ResourceTable from '@shell/components/ResourceTable';

import { findBy } from '@shell/utils/array';
import { allHash } from '@shell/utils/promise';
import { APP } from '@shell/config/types';

export default {
  layout: 'plain',

  components: {
    Tab,
    ResourceTabs,
    CruResourceFooter,
    ResourceTable,
  },

  data() {
    return {
      className: '',
      classes:   [],
      objects:   [],
      schema:    {},
      value:     {},
      mode:      'detail',
      similarityThreshold: 0.01,
      inputText: '',
      results: [
        {
          id: 1,
          title: '创建1',
          content: '广州市政府公布了关于进一步睦邻ighbors的若干措施的通知，其中包括了多项具体措施，旨在为企业提供更好的发展环境。',
          similarity: '7%'
        },
        {
          id: 2,
          title: '创建2',
          content: '广州市政府公布了关于进一步睦邻ighbors的若干措施的通知，其中包括了多项具体措施，旨在为企业提供更好的发展环境。广州市政府公布了关于进一步睦邻ighbors的若干措施的通知，其中包括了多项具体措施，旨在为企业提供更好的发展环境。',
          similarity: '7%'
        },
        {
          id: 3,
          title: '创建3',
          content: '广州市政府公布了关于进一步睦邻ighbors的若干措施的通知，其中包括了多项具体措施，旨在为企业提供更好的发展环境。',
          similarity: '7%'
        },
        {
          id: 4,
          title: '创建4',
          content: '广州市政府公布了关于进一步睦邻ighbors的若干措施的通知，其中包括了多项具体措施，旨在为企业提供更好的发展环境。',
          similarity: '7%'
        },
      ],
    };
  },

  async fetch() {
    this.fetchList();
  },

  computed: {
    location() {
      const className = this.$route.params.class;

      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster: 'local',
          resource: APP.KNOWLEDGE_BASE,
          id:      className,
        },
      };
    },

    resource() {
      const id = this.$route.params.id;

      const out = findBy(this.classes, 'class', id) || {};

      return out;
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    headers() {
      return [
        {
          name:  'text',
          label: 'Text',
          value: 'properties.text',
        },
      ];
    },

    rows() {
      const document = this.$route.params.id;

      const out = this.objects.filter((item) => item?.properties?.document === document);

      return out;
    },

    displayName() {
      return this.$route.params.id;
    },
  },

  methods: {
    async clickSave(buttonDone) {
      const inStore = this.$store.getters['currentProduct'].inStore;

      try {
        await this.$store.dispatch(
          `${ inStore }/request`,
          {
            url:    getAllSchemaAPI,
            method: 'POST',
            data:   { class: this.value.className }
          }
        );
        this.$message.success('创建成功');

        buttonDone(true);

        this.confirmCancel();

        return;
      } catch (error) {
        const message = error?.error?.[0]?.message;

        this.$message.error(`创建失败：${ message }`);

        buttonDone(false);
      }
    },

    confirmCancel() {
      this.$router.push(this.location);
    },

    async fetchList() {
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
    
    search() {
      // 这里可以添加实际的搜索逻辑
      console.log('搜索:', this.inputText);
    },
    
    updateThreshold(value) {
      this.similarityThreshold = value;
    }
  }
};
</script>

<template>
  <section class="cru">
    <div class="masthead">
      <header>
        <div class="title">
          <div class="primaryheader">
            <h1>
              <router-link
                :to="location"
                role="link"
                class="masthead-resource-list-link"
              >
                知识库:
              </router-link>
              {{ displayName }}
            </h1>
          </div>
        </div>
      </header>
    </div>
    
    <div class="hit-test-container">
      <div class="left-panel">
        <div class="config-section">
          <div class="section-header">数据配置参数</div>
          <div class="threshold-config">
            <div class="threshold-label">
              相似度阈值 
              <i class="icon icon-info" />
            </div>
            <div class="threshold-input-wrapper">
              <input 
                type="text" 
                v-model="similarityThreshold" 
                class="threshold-input"
              />
            </div>
            <div class="threshold-slider-wrapper">
              <input 
                type="range" 
                min="0.01" 
                max="1" 
                step="0.01" 
                v-model="similarityThreshold"
                class="threshold-slider"
                @input="updateThreshold"
              />
              <div class="range-labels">
                <span>0.01</span>
                <span>1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="input-section">
          <div class="section-header">输入</div>
          <div class="input-content">
            <textarea 
              v-model="inputText" 
              placeholder="请输入文本"
              class="input-textarea"
            ></textarea>
            <div class="input-actions">
              <div class="action-icons">
                <i class="icon icon-refresh" />
                <i class="icon icon-copy" />
              </div>
              <button class="submit-btn" @click="search">提交</button>
            </div>
          </div>
        </div>
        
        <div class="results-section">
          <div class="section-header">召回结果</div>
          <div class="results-content">
            <div v-if="results.length === 0" class="empty-results">
              <div class="empty-icon">
                <img src="/img/generic-empty.svg" alt="无结果" />
              </div>
              <div class="empty-text">无召回结果</div>
            </div>
            <div v-else class="results-list">
              <div v-for="result in results" :key="result.id" class="result-item">
                <div class="result-header">
                  <span class="result-title">{{ result.title }}</span>
                  <span class="result-similarity">相似度：{{ result.similarity }}</span>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.cru-resource-yaml-container {
  .resource-yaml {
    .yaml-editor {
      min-height: 100px;
    }
  }
}
.create-resource-container {
  .resource-container {
    display: flex;
    flex-direction: column;
  }

  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }

    &:focus-visible {
      @include focus-outline;
    }
  }
}

$logo: 60px;
$logo-space: 100px;

.title {
  margin-top: 20px;

  &.with-description {
    margin-top: 0;
  }
}

.subtype-container {
  position: relative;
  display: flex;
  height: 100%;
}

.subtype-body {
  flex: 1;
  padding: 10px;
}

.subtype-logo {
  align-items: center;
  display: flex;
  justify-content: center;
  min-width: $logo-space;
  min-height: $logo-space;
  overflow: hidden;
  background-color: var(--box-bg);

  img {
    width: $logo - 4px;
    height: $logo - 4px;
    object-fit: contain;
    position: relative;
    top: 2px;
  }
}

form.create-resource-container .cru {
  &__footer {
    border-top: var(--header-border-size) solid var(--header-border);
  }
}

.cru__footer {
  border-top: var(--header-border-size) solid var(--header-border);
}

.cru {
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  &__form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  &__content {
    flex-grow: 1;
    &-wizard {
      display: flex;
    }
  }

  &__footer {
    right: 0;
    position: sticky;
    bottom: 0;
    background-color: var(--header-bg);

    margin-left: -$space-m;
    margin-right: -$space-m;
    margin-bottom: -$space-m;
    padding: $space-s $space-m;
  }

  &__errors {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--header-bg);
    margin: 10px 0;
  }
}

.description {
  margin-bottom: 15px;
  margin-top: 5px;
}

.masthead {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 10px;
}

HEADER {
  margin: 0;
  grid-template-columns: minmax(0, 1fr) auto;
}

// 新的样式设计
.hit-test-container {
  display: flex;
  gap: 20px;
  padding: 0;
  height: calc(100vh - 200px);
}

.left-panel {
  width: 300px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section,
.input-section,
.results-section {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background-color: #fff;
  overflow: hidden;
}

.section-header {
  background-color: #f8f9fa;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #e5e5e5;
  color: #333;
}

.threshold-config {
  padding: 16px;
}

.threshold-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.threshold-input-wrapper {
  margin-bottom: 12px;
}

.threshold-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}

.threshold-slider-wrapper {
  position: relative;
}

.threshold-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e5e5e5;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4285f4;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4285f4;
    cursor: pointer;
    border: none;
  }
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.input-section {
  flex-shrink: 0;
}

.input-content {
  padding: 16px;
}

.input-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  resize: vertical;
  font-size: 13px;
  line-height: 1.4;
  
  &::placeholder {
    color: #9ca3af;
  }
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.action-icons {
  display: flex;
  gap: 8px;
  
  .icon {
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: #6b7280;
    
    &:hover {
      color: #4285f4;
    }
  }
}

.submit-btn {
  padding: 6px 16px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background-color: #3367d6;
  }
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.results-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: 400px; // 添加最大高度以启用滚动
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
}

.results-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.result-item {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
  width: 100%;
  height: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-title {
  font-weight: 500;
  font-size: 13px;
  color: #333;
}

.result-similarity {
  font-size: 12px;
  color: #666;
}

.result-content {
  font-size: 13px;
  line-height: 1.4;
  color: #555;
}
</style>
