<script>
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { SUBTYPE_MAPPING, CREATE_VERBS } from '@shell/models/management.llmos.ai.globalrole';
import { NAME } from '@shell/config/product/auth';

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;
const createGlobalRole = {
  name:   `c-cluster-${ NAME }-roles-resource-create`,
  params: {
    cluster:  'local',
    resource: MANAGEMENT.GLOBAL_ROLE,
  }
};

export default {
  name:       'Roles',
  components: {
    Tab, Tabbed, ResourceTable, Loading
  },

  async asyncData({ store }) {
    const globalRoleSchema = store.getters[`management/schemaFor`](MANAGEMENT.GLOBAL_ROLE);

    return { globalRoles: globalRoleSchema ? await store.dispatch(`management/findAll`, { type: MANAGEMENT.GLOBAL_ROLE }) : [] };
  },

  data() {
    const globalRoleSchema = this.$store.getters[`management/schemaFor`](MANAGEMENT.GLOBAL_ROLE);

    return {
      tabs: {
        [GLOBAL]: {
          canFetch:       globalRoleSchema?.collectionMethods.find((verb) => verb === 'GET'),
          canCreate:      globalRoleSchema?.resourceMethods.find((verb) => CREATE_VERBS.has(verb)),
          weight:         3,
          labelKey:       SUBTYPE_MAPPING.GLOBAL.labelKey,
          schema:         globalRoleSchema,
          createLocation: {
            ...createGlobalRole,
            query: { roleContext: GLOBAL }
          },
        },
      },

      GLOBAL,
      globalRoles: null,
    };
  },

  computed: {
    globalResources() {
      return this.globalRoles;
    },

    type() {
      return GLOBAL;
    },

    canCreate() {
      return this.tabs[this.type].canCreate;
    },

    createLabel() {
      return this.t(`rbac.roletemplate.subtypes.${ this.type }.createButton`);
    },

    createLocation() {
      return this.tabs[this.type].createLocation;
    }

  },
};
</script>

<template>
  <Loading v-if="!globalRoles" />
  <div v-else>
    <header>
      <div class="title">
        <h1 class="m-0">
          {{ t('rbac.roletemplate.label') }}
        </h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <n-link
            v-if="canCreate"
            :to="createLocation"
            class="btn role-primary"
          >
            {{ createLabel }}
          </n-link>
        </div>
      </div>
    </header>
    <Tabbed>
      <Tab
        v-if="tabs[GLOBAL].canFetch"
        :name="GLOBAL"
        :weight="tabs[GLOBAL].weight"
        :label-key="tabs[GLOBAL].labelKey"
      >
        <ResourceTable
          :schema="tabs[GLOBAL].schema"
          :rows="globalResources"
        />
      </Tab>
    </Tabbed>
  </div>
</template>
