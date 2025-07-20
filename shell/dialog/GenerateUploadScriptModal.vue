<script>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { message, Switch } from 'ant-design-vue';

import Banner from '@shell/components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { useI18n } from '@shell/composables/useI18n';
import CopyToClipboard from '@shell/components/CopyToClipboard';

export default {
  name: 'GenerateUploadScriptModal',

  components: {
    Banner,
    CopyToClipboard,
    'a-switch': Switch
  },

  props: {
    namespace: {
      type:     String,
      required: true
    },

    name: {
      type:     String,
      required: true
    },
  },

  emits: ['close'],

  setup(props, { emit }) {
    const store = useStore();
    const { t } = useI18n(store);

    const loading = ref(false);
    const errors = ref([]);
    const bearerToken = ref('');
    const displayToken = ref('');
    const bashScript = ref('');
    const isFolder = ref(true); // true for folder, false for file

    const namespace = computed(() => props?.namespace || 'default');
    const modelName = computed(() => props?.name || 'model-name');

    const bashScriptDisplay = computed(() => {
      return (bashScript.value || '').replace(`--bearer-token ${ bearerToken.value }`, `--bearer-token ******`);
    });

    const generateBashScript = () => {
      const sourceParam = isFolder.value ? '--source-dir [sourceDir]' : '--source-file [sourceFile]';
      const script = `python <(curl -sk https://raw.githubusercontent.com/llmos-ai/llmos-operator/4c7405593ec82c88d7041eba6056c0a7248b1e89/tools/upload_to_model.py) \\
   ${ sourceParam } \\
   --namespace ${ namespace.value } \\
   --model-name ${ modelName.value } \\
   --bearer-token ${ bearerToken.value }`;

      bashScript.value = script;
    };

    const createToken = async() => {
      try {
        loading.value = true;
        errors.value = [];

        // 创建token
        const inStore = store.getters['currentStore']('management.llmos.ai.token');
        const tokenResource = await store.dispatch(`${ inStore }/create`, {
          type:     MANAGEMENT.TOKEN,
          metadata: {
            generateName: 'llmos-upload-',
            namespace:    namespace.value
          },
          spec: {
            authProvider: 'local',
            expired:      true,
            userId:       null,
            ttlSeconds:   1800,
          }
        });

        const res = await tokenResource.save();

        // 获取完整的token信息
        const tokenDetail = await store.dispatch(`${ inStore }/find`, {
          type: MANAGEMENT.TOKEN,
          id:   res.id,
          opt:  { force: true }
        }, { root: true });

        bearerToken.value = tokenDetail.spec.token;
        generateBashScript();
      } catch (error) {
        errors.value = [error.message || 'Failed to create token'];
      } finally {
        loading.value = false;
      }
    };

    const copyScript = () => {
      navigator.clipboard.writeText(bashScript.value).then(() => {
        message.success(t('generic.copied'));
      }).catch(() => {
        message.error(t('generic.copyFailed'));
      });
    };

    const close = () => {
      emit('close');
    };

    onMounted(() => {
      createToken();
    });

    return {
      loading,
      errors,
      bashScript,
      displayToken,
      modelName,
      copyScript,
      close,
      t,
      bashScriptDisplay,
      isFolder,
      generateBashScript,
    };
  }
};
</script>

<template>
  <div class="generate-upload-script-modal">
    <div class="modal-header">
      <h3>
        {{ t('modelCard.actions.generateUploadScript.label') }}
      </h3>
    </div>

    <div class="modal-body">
      <Banner
        v-if="errors.length > 0"
        color="error"
        class="mb-20"
      >
        {{ errors.join(', ') }}
      </Banner>

      <div
        v-if="loading"
        class="text-center"
      >
        <i class="icon icon-spinner icon-spin" />
        {{ t('generateUploadScript.generating') }}
      </div>

      <div v-else-if="bashScript">
        <div class="mb-20">
          <h4>{{ t('generateUploadScript.instructions.steps.title') }}</h4>
          <ol class="instructions-list">
            <li>{{ t('generateUploadScript.instructions.steps.step1') }}</li>
            <li>{{ t('generateUploadScript.instructions.steps.step2') }}</li>
            <li>{{ t('generateUploadScript.instructions.steps.step3') }}</li>
          </ol>
        </div>

        <div class="script-container">
          <div class="script-header">
            <a-switch
              v-model:checked="isFolder"
              class="ml-10"
              @change="generateBashScript"
            >
              <template #checkedChildren>
                {{ t('generateUploadScript.uploadType.folder') }}
              </template>
              <template #unCheckedChildren>
                {{ t('generateUploadScript.uploadType.file') }}
              </template>
            </a-switch>
            <CopyToClipboard
              :text="bashScript"
              class="copy-button"
            />
          </div>
          <pre class="script-content">{{ bashScriptDisplay }}</pre>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button
        type="button"
        class="btn role-secondary"
        @click="close"
      >
        {{ t('generic.close') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.generate-upload-script-modal {
  .modal-header {
    padding: 20px 20px 0;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .instructions-list {
    margin: 10px 0;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  }

  .upload-type-selector {
    .switch-label {
      display: flex;
      align-items: center;
      font-weight: 500;

      .switch-text {
        color: var(--primary);
      }
    }
  }

  .script-container {
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;

    .script-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: var(--box-bg);
      border-bottom: 1px solid var(--border);

      .script-title {
        font-weight: 500;
        font-size: 14px;
      }
    }

    .script-content {
      padding: 15px;
      margin: 0;
      background-color: var(--code-bg);
      color: var(--code-text);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .modal-footer {
    padding: 15px 20px;
    border-top: 1px solid var(--border);
    text-align: right;
  }
}
</style>
