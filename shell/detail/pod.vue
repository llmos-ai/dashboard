<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import { STATE, SIMPLE_NAME, IMAGE_NAME } from '@shell/config/table-headers';
import { sortableNumericSuffix } from '@shell/utils/sort';
import { findBy } from '@shell/utils/array';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import { mapGetters } from 'vuex';
import { allDashboardsExist } from '@shell/utils/grafana';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { NAMESPACE } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';

export default {
  name: 'PodDetail',

  components: {
    DashboardMetrics,
    ResourceTabs,
    Tab,
    SortableTable,
    LabeledSelect,
  },

  mixins: [CreateEditView],

  async fetch() {},

  data() {
    const t = this.$store.getters['i18n/t'];
    const POD_OPTION = {
      id:    '//POD//',
      label: t('workload.metrics.pod'),
    };

    return {
      POD_OPTION,
      showMetrics:                     false,
      showProjectMetrics:              false,
      selection:                       POD_OPTION,
      metricsID:                       null,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    containers() {
      const containers = this.allContainers;
      const statuses = this.allStatuses;

      return (containers || []).map((container) => {
        const status = findBy(statuses, 'name', container.name);
        const state = status?.state || {};
        const descriptions = [];

        // There can be only one member of a `ContainerState`
        const s = Object.values(state)[0] || {};
        const reason = s.reason || '';
        const message = s.message || '';
        const showBracket = s.reason && s.message;
        const description = `${ reason }${ showBracket ? ' (' : '' }${ message }${ showBracket ? ')' : '' }`;

        if (description) {
          descriptions.push(description);
        }

        // add lastState to show termination reason
        if (status?.lastState?.terminated) {
          const ls = status?.lastState?.terminated;
          const lsReason = ls.reason || '';
          const lsMessage = ls.message || '';
          const lsExitCode = ls.exitCode || '';
          const lsStartedAt = this.dateTimeFormat(ls.startedAt);
          const lsFinishedAt = this.dateTimeFormat(ls.finishedAt);
          const lsShowBracket = ls.reason && ls.message;
          const lsDescription = `${ lsReason }${ lsShowBracket ? ' (' : '' }${ lsMessage }${ lsShowBracket ? ')' : '' }`;

          descriptions.push(this.t('workload.container.terminationState', {
            lsDescription, lsExitCode, lsStartedAt, lsFinishedAt
          }));
        }

        return {
          ...container,
          status:           status || {},
          stateDisplay:     status ? this.value.containerStateDisplay(status) : undefined,
          stateBackground:  status ? this.value.containerStateColor(status).replace('text', 'bg') : undefined,
          nameSort:         sortableNumericSuffix(container.name).toLowerCase(),
          readyIcon:        status?.ready ? 'icon-checkmark text-success ml-5' : 'icon-x text-error ml-5',
          availableActions: this.value.containerActions,
          stateObj:         status, // Required if there's a description
          stateDescription: descriptions.join(' | '), // Required to display the description
          initIcon:         this.value.containerIsInit(container) ? 'icon-checkmark icon-2x text-success ml-5' : 'icon-minus icon-2x text-muted ml-5',

          // Call openShell here so that opening the shell
          // at the container level still has 'this' in scope.
          openShell: () => this.value.openShell(container.name),
          // Call openLogs here so that opening the logs
          // at the container level still has 'this' in scope.
          openLogs:  () => this.value.openLogs(container.name)
        };
      });
    },

    allContainers() {
      const { containers = [], initContainers = [] } = this.value.spec;

      return [...containers, ...initContainers];
    },

    allStatuses() {
      const { containerStatuses = [], initContainerStatuses = [] } = this.value.status;

      return [...containerStatuses, ...initContainerStatuses];
    },

    containerHeaders() {
      return [
        STATE,
        {
          name:          'ready',
          labelKey:      'tableHeaders.ready',
          formatter:     'IconText',
          formatterOpts: { iconKey: 'readyIcon' },
          align:         'left',
          width:         75,
          sort:          'readyIcon'
        },
        {
          ...SIMPLE_NAME,
          value: 'name'
        },
        IMAGE_NAME,
        {
          name:          'isInit',
          labelKey:      'workload.container.init',
          formatter:     'IconText',
          formatterOpts: { iconKey: 'initIcon' },
          align:         'left',
          width:         75,
          sort:          'initIcon'
        },
        {
          name:     'restarts',
          labelKey: 'tableHeaders.restarts',
          value:    'status.restartCount',
          align:    'right',
          width:    75
        },
        {
          name:          'age',
          labelKey:      'tableHeaders.started',
          value:         'status.state.running.startedAt',
          sort:          'status.state.running.startedAt:desc',
          search:        false,
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          align:         'right'
        }
      ];
    },

    graphVars() {
      return {
        namespace: this.value.namespace,
        pod:       this.value.name
      };
    },

    metricsOptions() {
      const v = this.containers.map((c) => {
        return {
          id:    c.name,
          label: c.name
        };
      });

      v.unshift(this.POD_OPTION);

      return v;
    },

    dateTimeFormatString() {
      const dateFormat = escapeHtml( this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return `${ dateFormat } ${ timeFormat }`;
    }
  },

  methods: {
    selectionChanged(c) {
      const id = c === this.POD_OPTION ? null : c.id;

      this.metricsID = id;
      this.selection = c;
    },

    dateTimeFormat(value) {
      return value ? day(value).format(this.dateTimeFormatString) : '';
    }
  }
};
</script>

<template>
  <ResourceTabs
    mode="view"
    class="mt-20"
    :value="value"
  >
    <Tab
      :label="t('workload.container.titles.containers')"
      name="containers"
      :weight="3"
    >
      <SortableTable
        :rows="containers"
        :headers="containerHeaders"
        :mode="mode"
        key-field="name"
        :search="false"
        :row-actions="true"
        :table-actions="false"
      />
    </Tab>
  </ResourceTabs>
</template>
<style scoped>
  .pod-metrics-chooser {
    width: fit-content;
    margin-bottom: 10px;
    min-width: 300px;
  }
</style>
