<template>
  <a-Card
    :title="t('modelCard.actions.cache.modalTitle')"
    :show-highlight-border="true"
    :sticky="true"
  >
    <div class="create-local-model-content">
      <div class="model-info">
        <div class="model-icon">
          <img
            :src="iconUrl"
            class="size-[40px]"
            alt="model icon"
          >
        </div>
        <div class="model-details">
          <h3 class="model-name">
            {{ modelName }}
          </h3>
        </div>
      </div>

      <div class="version-info">
        <a-descriptions
          :column="1"
          size="small"
          bordered
        >
          <a-descriptions-item :label="t('modelCard.actions.cache.currentVersion')">
            {{ nextVersion }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('modelCard.actions.cache.registry')">
            {{ registry }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('modelCard.actions.cache.namespace')">
            {{ namespace }}
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <a-alert
        :message="t('modelCard.actions.cache.confirmMessage')"
        type="info"
        show-icon
        class="mt-4"
      />
    </div>
    <template #actions>
      <a-button
        @click="handleCancel"
      >
        {{ t('generic.cancel') }}
      </a-button>

      <a-button
        type="primary"
        :loading="loading"
        @click="handleOk"
      >
        {{ t('generic.create') }}
      </a-button>
    </template>
  </a-Card>
</template>

<script>
import { message } from 'ant-design-vue';
import { LLMOS as LLMOS_TYPES } from '@shell/config/types';

export default {
  name: 'CreateLocalModelModal',

  props: {
    modelResource: {
      type:     Object,
      required: true
    }
  },

  emits: ['close'],

  data() {
    return { loading: false };
  },

  computed: {
    modelName() {
      return this.modelResource?.metadata?.name || '';
    },

    description() {
      return this.modelResource?.spec?.modelCard?.description || '';
    },

    iconUrl() {
      return this.modelResource?.iconUrl || '/img/generic-catalog.svg';
    },

    nextVersion() {
      return this.modelResource?.localModel?.nextVersion || '1';
    },

    registry() {
      return this.modelResource?.spec?.registry || '';
    },

    namespace() {
      return this.modelResource?.metadata?.namespace || '';
    }
  },

  methods: {
    async handleOk() {
      this.loading = true;

      try {
        // 在创建版本前保存当前版本号，避免创建后版本号自动递增导致显示错误
        const currentVersion = this.nextVersion;

        await this.createLocalModel();
        message.success(this.t('modelCard.actions.cache.successMessage', {
          name:    this.modelName,
          version: currentVersion
        }));
        this.handleCancel();
      } catch (err) {
        message.error(this.t('modelCard.actions.cache.errorMessage', { error: err.message || err }));
      } finally {
        this.loading = false;
      }
    },

    handleCancel() {
      this.$emit('close');
    },

    async createLocalModel() {
      const name = this.modelResource.metadata?.name;

      // 创建或获取本地模型
      let localModel = this.modelResource.localModel;

      if (!localModel.id) {
        localModel = await this.modelResource.$dispatch('create', {
          type:     LLMOS_TYPES.LOCAL_MODEL,
          metadata: {
            name,
            namespace: this.modelResource.metadata?.namespace,
          },
          spec: {
            registry:  this.modelResource.spec?.registry,
            modelName: this.modelResource.id
          },
        });

        await localModel.save();
      }

      // 创建本地模型版本
      const localModelVersion = await this.modelResource.$dispatch('create', {
        type:     LLMOS_TYPES.LOCAL_MODEL_VERSION,
        metadata: {
          name:      `${ name }-${ localModel.nextVersion }`,
          namespace: this.modelResource.metadata?.namespace,
        },
        spec: { localModel: name },
      });

      await localModelVersion.save();
    }
  }
};
</script>

<style lang="scss" scoped>
.create-local-model-content {
  .model-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;

    .model-icon {
      margin-right: 16px;

      img {
        border-radius: 8px;
      }
    }

    .model-details {
      flex: 1;

      .model-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #262626;
      }

      .model-description {
        margin: 0;
        color: #8c8c8c;
        font-size: 14px;
        line-height: 1.4;
        max-width: 100%;
        overflow: hidden;
      }
    }
  }

  .version-info {
    margin-bottom: 16px;
  }
}
</style>
