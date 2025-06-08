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
                Document:
              </router-link>
              {{ displayName }}
            </h1>
          </div>
        </div>
      </header>
    </div>

    <div class="create-resource-container cru__form">
      <div class="resource-container cru__content">
        <ResourceTabs
          :value="value"
          :needConditions="false"
          :needEvents="false"
          :needRelated="false"
        >
          <Tab
            name="files"
            label="分段"
          >
            <ResourceTable
              :loading="loading"
              :schema="schema"
              :rows="rows"
              :headers="headers"
              default-sort-by="age"
            />
          </Tab>
        </ResourceTabs>
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
          <div />
        </template>
      </CruResourceFooter>
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
