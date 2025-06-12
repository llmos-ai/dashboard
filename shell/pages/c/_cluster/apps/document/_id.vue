<script>
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import CruResourceFooter from '@shell/components/CruResourceFooter';
import ResourceTable from '@shell/components/ResourceTable';

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
      loading:   false,
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
      const className = this.$route.params.class;
      const namespace = this.$route.params.namespace;
      const out = this.$store.getters['cluster/byId'](APP.KNOWLEDGE_BASE, `${ namespace }/${ className }`);

      return out;
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    headers() {
      return [
        {
          name:  'content',
          label: 'Content',
          value: 'content',
          width: '200px',
        },
      ];
    },

    rows() {
      return this.objects.map((item) => {
        return {
          ...item,
          availableActions: [
            {
              action: 'view',
              label:  this.t('knowledgeBase.actions.view'),
              icon:   'icon icon-file',
            },
          ],

          view: () => {
            this.$store.dispatch('cluster/promptModal', {
              component:      'TextViewerModal',
              modalWidth:     '1000px',
              componentProps: { content: item.content }
            });
          },
        };
      });
    },

    displayName() {
      return this.$route.params.id;
    },
  },

  methods: {
    confirmCancel() {
      this.$router.push(this.location);
    },

    async fetchList() {
      this.loading = true;

      await allHash({ knowledgeBase: this.$store.dispatch('cluster/findAll', { type: APP.KNOWLEDGE_BASE }) });

      const res = await this.resource.doAction('listObjects', {
        offset: 0,
        limit:  10,
      });

      this.objects = res.objects;

      this.loading = false;
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
              :tableActions="false"
            >
              <template
                #col:content="{row}"
              >
                <td class="content-cell-multiline">
                  <div
                    class="content-text-multiline"
                    :title="row.content"
                  >
                    {{ row.content }}
                  </div>
                </td>
              </template>
            </ResourceTable>
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
.content-cell-multiline {
  max-width: 100%; // 使用父容器的最大宽度
  width: 100%;     // 占满可用宽度

  .content-text-multiline {
    display: -webkit-box;
    -webkit-line-clamp: 2; // 显示2行
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
    max-height: calc(1.4em * 2); // 2行的高度
    cursor: pointer;
    word-break: break-word; // 在单词边界换行
    white-space: normal;    // 允许换行
  }
}

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
