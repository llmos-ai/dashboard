<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { NAME } from '@shell/config/table-headers';

export default {
  components: {
    Tab,
    ResourceTabs,
    SortableTable,
    Loading
  },
  mixins: [
    CreateEditView
  ],
  async fetch() {
    const canSeeGlobalRoles = !!this.$store.getters[`management/canList`](MANAGEMENT.GLOBAL_ROLE);

    if (canSeeGlobalRoles) {
      this.globalBindings = await this.fetchGlobalRoleBindings(this.value.id);
    }
    await this.$store.dispatch('management/find', { type: MANAGEMENT.USER, id: this.value.id });
  },
  data() {
    const role = {
      name:     'role',
      labelKey: 'user.detail.generic.tableHeaders.role',
      value:    'roleTemplate.displayName',
      sort:     'roleTemplate.displayName',
    };
    const since = {
      name:          'since',
      labelKey:      'user.detail.generic.tableHeaders.granted',
      value:         'metadata.creationTimestamp',
      sort:          'metadata.creationTimestamp:desc',
      search:        false,
      formatter:     'LiveDate',
      formatterOpts: { addSuffix: true },
      width:         '20%',
    };

    const isAdmin = this.value.status?.isAdmin || false;

    return {
      headers: {
        gp: [
          {
            name:      'permission',
            labelKey:  'user.detail.globalPermissions.tableHeaders.permission',
            value:     'hasBound',
            sort:      ['hasBound:desc'],
            formatter: 'Checked',
            width:     75,
            align:     'center'
          },
          NAME,
          {
            ...since,
            value: 'bound',
            sort:  'bound',
          }
        ],
        cr: [
          {
            name:          'cluster',
            labelKey:      'user.detail.clusterRoles.tableHeaders.cluster',
            value:         'clusterDisplayName',
            sort:          'clusterDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'clusterDetailLocation' },
          }, { ...role },
          { ...since }
        ],
        pr: [
          {
            name:          'project',
            labelKey:      'user.detail.projectRoles.tableHeaders.project',
            value:         'projectDisplayName',
            sort:          'projectDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'projectDetailLocation' },
          }, {
            name:          'cluster',
            labelKey:      'user.detail.clusterRoles.tableHeaders.cluster',
            value:         'clusterDisplayName',
            sort:          'clusterDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'clusterDetailLocation' },
          }, { ...role },
          { ...since }
        ]
      },
      globalBindings:      null,
      canSeeRoleTemplates: false,
      isAdmin,
    };
  },
  computed: {},
  methods:  {
    async fetchGlobalRoleBindings(userId) {
      try {
        const roles = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE });
        const out = await Promise.all(roles
          .map((r) => this.$store.dispatch(`management/clone`, { resource: r }))
        );

        out.forEach((r) => {
          r.hasBound = false;
        });

        const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE_BINDING });

        globalRoleBindings
          .filter((binding) => binding.subjects[0]?.name === userId)
          .forEach((binding) => {
            const roleTemplateBinding = roles.find((r) => r.id === binding.roleTemplateRef?.name);

            if (roleTemplateBinding.id === 'admin') {
              this.isAdmin = true;
            }

            if (roleTemplateBinding.isSpecial) {
              this.getEnabledRoles(roleTemplateBinding, out).forEach((r) => {
                r.hasBound = true;
                r.bound = binding?.metadata.creationTimestamp;
              });
            } else {
              const entry = out.find((o) => o.id === binding.roleTemplateRef.name);

              if (entry) {
                entry.hasBound = true;
                entry.bound = binding?.metadata.creationTimestamp;
              }
            }
          });

        return out;
      } catch (e) {
        // Swallow the error. It's probably due to the user not having the correct permissions to read global roles
        console.error('Failed to fetch RoleTemplateBindings: ', e); // eslint-disable-line no-console
      }
    },

    getEnabledRoles(globalRole, out) {
      const globalRoleRules = globalRole.rules || [];

      return out.filter((r) => {
        // If the global role doesn't contain any rules... don't show the user as having the role (confusing)
        if (!r?.rules?.length) {
          return false;
        }

        return r.rules.every((rule) => this.containsRule(globalRoleRules, rule));
      });
    },

    // Global permissions helpers
    hasPermission(globalRoleRules, permission) {
      return globalRoleRules.find((gRule) => {
        return ((gRule.apiGroups || []).includes('*') || (gRule.apiGroups || []).includes(permission.apiGroup)) &&
            ((gRule.resources || []).includes('*') || (gRule.resources || []).includes(permission.resource)) &&
            ((gRule.verbs || []).includes('*') || (gRule.verbs || []).includes(permission.verb));
      });
    },
    containsRule(globalRoleRules, rule) {
      const apiGroups = (rule.apiGroups || []);
      const resources = (rule.resources || []);
      const verbs = (rule.verbs || []);
      const permissions = [];

      apiGroups.forEach((apiGroup) => resources.forEach((resource) => verbs.forEach((verb) => permissions.push({
        apiGroup,
        resource,
        verb
      }))));

      return permissions.every((permission) => this.hasPermission(globalRoleRules, permission));
    },
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs
      v-model:value="value"
      :mode="mode"
    >
      <Tab
        v-if="globalBindings"
        label-key="user.detail.globalPermissions.label"
        name="gp"
        :weight="3"
      >
        <div class="subtext">
          {{ t("user.detail.globalPermissions.description") }}
        </div>
        <div
          v-if="isAdmin"
          class="admin"
        >
          {{ t("user.detail.globalPermissions.adminMessage") }}
        </div>
        <SortableTable
          v-else
          :rows="globalBindings"
          :headers="headers.gp"
          key-field="id"
          :table-actions="false"
          :row-actions="false"
          :search="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.subtext {
  margin-bottom: 10px;
  font-style: italic;
}
.admin {
  display: flex;
  justify-content: center;
  margin: 30px 0 10px;
  font-weight: bold;
}
</style>
