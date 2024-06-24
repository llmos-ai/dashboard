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
    await this.$store.dispatch('management/find', { type: MANAGEMENT.USER, id: this.value.id })
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
      isAdmin:             false,
    };
  },
  computed: {},
  methods: {}

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs
      v-model="value"
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
