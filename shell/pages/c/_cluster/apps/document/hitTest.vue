<script>
import SliderInput from '@shell/components/SliderInput';

import { allHash } from '@shell/utils/promise';
import { APP } from '@shell/config/types';

export default {
  layout: 'plain',

  components: { SliderInput },

  data() {
    return {
      className:  '',
      classes:    [],
      objects:    [],
      schema:     {},
      value:      {},
      mode:       'detail',
      threshold:  0.2,
      topK:       2,
      inputText:  '',
      results:    [],
      submitting: false,
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
          cluster:  'local',
          resource: APP.KNOWLEDGE_BASE,
          id:       className,
        },
      };
    },

    resource() {
      const id = this.$route.params.id;
      const namespace = this.$route.params.namespace;
      const out = this.$store.getters['cluster/byId'](APP.KNOWLEDGE_BASE, `${ namespace }/${ id }`);

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

    canSubmit() {
      return this.inputText;
    },
  },

  methods: {
    async submit(buttonDone) {
      try {
        this.submitting = true;

        const res = await this.resource.doAction('search', {
          query:     this.inputText,
          limit:     this.topK,
          threshold: this.threshold,
        });

        this.results = res.Results.sort((b, a) => {
          return a.distance - b.distance;
        });
      } catch (error) {
        const message = error?.error?.[0]?.message;

        this.$message.error(`测试失败：${ message }`);
      }

      this.submitting = false;
    },

    confirmCancel() {
      this.$router.push(this.location);
    },

    async fetchList() {
      await allHash({ knowledgeBase: this.$store.dispatch('cluster/findAll', { type: APP.KNOWLEDGE_BASE }) });
    },

    percentFormatted(value) {
      return `${ (value * 100).toFixed(2) }%`;
    },

    onResultClick(result) {
      this.$store.dispatch('cluster/promptModal', {
        component:      'TextViewerModal',
        modalWidth:     '1000px',
        componentProps: { content: result.content }
      });
    },
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
          <div
            class="subheader"
          >
            <span>
              命中测试
            </span>
          </div>
        </div>
      </header>
    </div>

    <div class="hit-test-container">
      <div class="left-panel">
        <div class="config-section">
          <div class="section-header">
            {{ t('knowledgeBase.hitTest.panel.dataConfig.label') }}
          </div>
          <div class="threshold-config">
            <SliderInput
              v-model:value="threshold"
              :label="t('knowledgeBase.hitTest.threshold.label')"
              :interval="0.01"
              :min="0.01"
              :max="1"
              :defaultValue="0.2"
              :description="t('knowledgeBase.hitTest.threshold.tooltip')"
              @change="update"
            />

            <SliderInput
              v-model:value="topK"
              :label="t('knowledgeBase.hitTest.topK.label')"
              :interval="1"
              :min="1"
              :max="10"
              :defaultValue="2"
              :description="t('knowledgeBase.hitTest.topK.tooltip')"
              @change="update"
            />
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="input-section">
          <div class="section-header">
            {{ t('knowledgeBase.hitTest.panel.input.label') }}
          </div>
          <div class="input-content">
            <textarea
              v-model="inputText"
              placeholder="请输入文本"
              class="input-textarea"
            />
            <div class="input-actions">
              <div class="action-icons" />
              <a-button
                class="submit-btn"
                :loading="submitting"
                :disabled="!canSubmit"
                type="primary"
                @click="submit"
              >
                提交
              </a-button>
            </div>
          </div>
        </div>

        <div class="results-section">
          <div class="section-header">
            {{ t('knowledgeBase.hitTest.panel.result.label') }}
          </div>
          <div class="results-content">
            <div
              v-if="results.length === 0"
              class="empty-results"
            >
              <a-empty />
            </div>
            <div
              v-else
              class="results-list"
            >
              <div
                v-for="result in results"
                :key="result.id"
                class="result-item hand"
                @click="onResultClick(result)"
              >
                <div class="result-header">
                  <span class="result-title">
                    {{ result.title }}
                  </span>
                  <span class="result-similarity">
                    相似度：
                    {{ percentFormatted(result.distance) }}
                  </span>
                </div>
                <div class="result-content">
                  {{ result.content }}
                </div>
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

.subheader {
  display: flex;
  flex-direction: row;
  color: var(--input-label);
  & > * {
    margin: 5px 20px 5px 0px;
  }

  .live-data {
    color: var(--body-text);
    margin-left: 3px;
  }
}

.hit-test-container {
  display: flex;
  gap: 20px;
  padding: 0;
  height: calc(100vh - 210px);
}

.left-panel {
  width: 300px;
  flex-shrink: 0
}

.config-section {
  height: calc(100vh - 210px);
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
