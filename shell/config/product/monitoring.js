import { DSL, IF_HAVE } from '@shell/store/type-map';
import { MONITORING } from '@shell/config/types';
import { STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';
import { NAME as LLMOS } from '@shell/config/product/llmos';

export const NAME = 'monitoring';
export const ADDON_NAME = 'llmos-monitoring';
export const ADDON_NAMESPACE = 'llmos-monitoring-system';

export function init(store) {
  const {
    product,
    basicType,
    headers,
    mapType,
    virtualType,
    weightType,
    weightGroup,
    configureType,
  } = DSL(store, NAME);

  const {
    ALERTMANAGER,
    ALERTMANAGER_CONFIG,
    PROMETHEUS,
    PROMETHEUS_RULE,
    SERVICE_MONITOR,
    POD_MONITOR,
  } = MONITORING;

  product({
    ifHave:              IF_HAVE.MONITORING, // possible RBAC issue here if mon turned on but user doesn't have view/read roles on service/pod monitors
    icon:                NAME,
    showNamespaceFilter: true,
    hideKubeShell:       true,
    hideKubeConfig:      true,
    hideCopyConfig:      true,
    weight:              90,
    category:            LLMOS,
    iconHeader:          require(`@shell/assets/images/pl/llm.svg`),
  });

  virtualType({
    label:      'Monitoring',
    namespaced: false,
    name:       'monitoring-overview',
    weight:     105,
    route:      { name: 'c-cluster-monitoring' },
    exact:      true,
    overview:   true,
  });

  virtualType({
    label:  'Monitors',
    group:  'monitoring',
    name:   'monitor',
    icon:   'globe',
    route:  { name: 'c-cluster-monitoring-monitor' },
    weight: 1,
  });

  configureType('monitor', { showListMasthead: false });

  basicType([
    'monitoring-overview',
    'monitor',
  ]);

  basicType([
    ALERTMANAGER_CONFIG,
  ], 'Alerting');

  basicType([
    PROMETHEUS,
    PROMETHEUS_RULE,
  ], 'Advanced');

  mapType(SERVICE_MONITOR, store.getters['i18n/t'](`typeLabel.${ SERVICE_MONITOR }`, { count: 2 }));
  mapType(POD_MONITOR, store.getters['i18n/t'](`typeLabel.${ POD_MONITOR }`, { count: 2 }));
  mapType(PROMETHEUS_RULE, store.getters['i18n/t'](`typeLabel.${ PROMETHEUS_RULE }`, { count: 2 }));
  mapType(ALERTMANAGER_CONFIG, store.getters['i18n/t'](`typeLabel.${ ALERTMANAGER_CONFIG }`, { count: 2 }));

  weightType(SERVICE_MONITOR, 105, true);
  weightType(ALERTMANAGER_CONFIG, 104, true);
  weightType(POD_MONITOR, 103, true);
  weightType(PROMETHEUS_RULE, 102, true);

  weightGroup(['Monitor', 'Alerting'], 2, true);
  weightGroup('Advanced', 1, true);

  headers(ALERTMANAGER, [
    STATE,
    NAME_COL,
    {
      name:     'version',
      labelKey: 'tableHeaders.version',
      sort:     'spec.version',
      value:    'spec.version'
    },
    {
      name:      'replicas',
      labelKey:  'tableHeaders.replicas',
      value:     'spec.replicas',
      sort:      'spec.replicas',
      formatter: 'Number',
    },
    AGE
  ]);

  headers(ALERTMANAGER_CONFIG, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    {
      name:      'receivers',
      labelKey:  'tableHeaders.receivers',
      formatter: 'ReceiverIcons',
      value:     'name'
    },
  ]);

  headers(PROMETHEUS, [
    STATE,
    NAME_COL,
    {
      name:     'version',
      labelKey: 'tableHeaders.version',
      sort:     'spec.version',
      value:    'spec.version'
    },
    {
      name:      'replicas',
      labelKey:  'tableHeaders.replicas',
      value:     'spec.replicas',
      sort:      'spec.replicas',
      formatter: 'Number',
    },
    AGE
  ]);
}
