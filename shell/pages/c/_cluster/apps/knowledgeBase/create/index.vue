<script>
import { getAllSchemaAPI } from '@/shell/config/weaviate';
import LabeledInput from '@shell/components/form/LabeledInput/LabeledInput.vue';
import CruResourceFooter from '@shell/components/CruResourceFooter';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  layout: 'plain',

  components: {
    LabeledInput,
    CruResourceFooter,
    AsyncButton,
  },

  data() {
    return {
      classes: [],
      objects: [],
      value:   {},
    };
  },

  async fetch() {
    this.fetchList();
  },

  computed: {
    location() {
      return {
        name:   'c-cluster-apps-knowledgeBase',
        params: { cluster: 'local' },
      };
    },

    canSave() {
      return !!this.value.className;
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
                Knowledge Base:
              </router-link>
              <t
                class="masthead-resource-title"
                :k="'resourceDetail.header.create'"
                :escapehtml="false"
                :subtype="''"
              />
            </h1>
          </div>
        </div>
      </header>
    </div>

    <div class="create-resource-container cru__form">
      <div class="resource-container cru__content">
        <div class="row mb-10">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.className"
              label="Name"
              placeholder="Please input Name"
              required
            />
          </div>
        </div>
      </div>

      <CruResourceFooter
        class="create-resource-container cru__footer"
        :mode="mode"
        :is-form="true"
        :show-cancel="true"
        @cancel-confirmed="confirmCancel"
      >
        <template
          #default
        >
          <div>
            <a-space>
              <AsyncButton
                ref="save"
                type="primary"
                :disabled="!canSave"
                :mode="mode"
                @click="clickSave($event)"
              />
            </a-space>
          </div>
        </template>
      </CruResourceFooter>
    </div>

    <!-- <ResourceTabs
      :value="value"
      class="mt-15"
      :need-conditions="true"
      :need-events="false"
      :need-related="false"
      :side-tabs="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        :label="t('generic.tabs.basic')"
        :weight="2"
      >
        <div class="row mb-10">
          <div class="col span-12">

          </div>
        </div>
      </Tab>
    </ResourceTabs> -->
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
    display: flex; // Ensures content grows in child CruResources
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
    // Only show border when the mode is not view
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

    // Overrides outlet padding
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
</style>
