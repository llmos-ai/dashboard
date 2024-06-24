import {
  CONFIG_MAP,
  EVENT,
  NODE, SECRET, INGRESS,
  WORKLOAD, WORKLOAD_TYPES, SERVICE, HPA, NETWORK_POLICY, PV, PVC, STORAGE_CLASS, POD, POD_DISRUPTION_BUDGET, LIMIT_RANGE, RESOURCE_QUOTA,
  RBAC,
  MANAGEMENT,
  NAMESPACE,
  VIRTUAL_TYPES,
} from '@shell/config/types';

import {
  STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS,
  INGRESS_DEFAULT_BACKEND, INGRESS_TARGET, INGRESS_CLASS,
  SPEC_TYPE, TARGET_PORT, SELECTOR, NODE as NODE_COL, TYPE, WORKLOAD_IMAGES, POD_IMAGES,
  USER_ID, USERNAME, USER_DISPLAY_NAME, USER_PROVIDER, WORKLOAD_ENDPOINTS, STORAGE_CLASS_DEFAULT,
  STORAGE_CLASS_PROVISIONER, PERSISTENT_VOLUME_SOURCE,
  HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA,
  DESCRIPTION, SUB_TYPE, PERSISTENT_VOLUME_CLAIM, RECLAIM_POLICY, PV_REASON, WORKLOAD_HEALTH_SCALE, POD_RESTARTS,
  DURATION, MESSAGE, REASON, LAST_SEEN_TIME, EVENT_TYPE, OBJECT, ROLE,
} from '@shell/config/table-headers';

import { DSL } from '@shell/store/type-map';

export const NAME = 'explorer';

export function init(store) {
  const {
    product,
    basicType,
    ignoreType,
    ignoreGroup,
    mapGroup,
    weightGroup,
    weightType,
    headers,
    virtualType,
    componentForType,
    configureType,
    setGroupDefaultType,
  } = DSL(store, NAME);

  product({
    removable:           false,
    weight:              3,
    showNamespaceFilter: true,
    icon:                'compass',
    typeStoreMap:        {}
  });

  basicType([
    'cluster-dashboard',
    'namespaces',
    NODE,
    EVENT,
  ], 'cluster');

  basicType([
    LIMIT_RANGE,
    NETWORK_POLICY,
    POD_DISRUPTION_BUDGET,
    RESOURCE_QUOTA,
  ], 'policy');

  basicType([
    SERVICE,
    INGRESS,
    HPA,
  ], 'serviceDiscovery');

  basicType([
    PV,
    PVC,
    STORAGE_CLASS,
    SECRET,
    CONFIG_MAP
  ], 'storage');

  basicType([
    WORKLOAD,
    WORKLOAD_TYPES.DEPLOYMENT,
    WORKLOAD_TYPES.DAEMON_SET,
    WORKLOAD_TYPES.STATEFUL_SET,
    WORKLOAD_TYPES.JOB,
    WORKLOAD_TYPES.CRON_JOB,
    POD,
  ], 'workload');

  weightGroup('cluster', 99, true);
  weightGroup('workload', 98, true);
  weightGroup('serviceDiscovery', 96, true);
  weightGroup('storage', 95, true);
  weightGroup('policy', 94, true);
  weightType(POD, -1, true);

  // here is where we define the usage of the WORKLOAD custom list view for
  // all the workload types (ex: deployments, cron jobs, daemonsets, etc)
  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking
  ignoreType(NAMESPACE);

  mapGroup(/^(core)?$/, 'core');
  mapGroup('apps', 'apps');
  mapGroup('batch', 'Batch');
  mapGroup('autoscaling', 'Autoscaling');
  mapGroup('policy', 'Policy');
  mapGroup('networking.k8s.io', 'Networking');
  mapGroup(/^(.+\.)?api(server)?.*\.k8s\.io$/, 'API');
  mapGroup('rbac.authorization.k8s.io', 'RBAC');
  mapGroup('admissionregistration.k8s.io', 'admission');
  mapGroup('crd.projectcalico.org', 'Calico');
  mapGroup(/^(.+\.)?cert-manager\.(k8s\.)?io$/, 'Cert Manager');
  mapGroup(/^(.*\.)?(k3s)\.cattle\.io$/, 'K3s');
  mapGroup(/^(.*\.)?upgrade\.cattle\.io$/, 'Upgrade Controller');
  mapGroup(/^(.*\.)?traefik\.containo\.us$/, 'Træfik');
  mapGroup(/^(.*\.)?cluster\.x-k8s\.io$/, 'clusterProvisioning');
  mapGroup(/^(aks|eks|gke|rke|rke-machine-config|rke-machine|provisioning)\.cattle\.io$/, 'clusterProvisioning');

  configureType(NODE, { isCreatable: false, isEditable: true });
  configureType(WORKLOAD_TYPES.JOB, { isEditable: false, match: WORKLOAD_TYPES.JOB });

  configureType(EVENT, { limit: 500 });
  weightType(EVENT, -1, true);

  // Allow Pods to be grouped by node
  configureType(POD, {
    listGroups: [
      {
        icon:       'icon-cluster',
        value:      'role',
        field:      'groupByNode',
        hideColumn: 'groupByNode',
        tooltipKey: 'resourceTable.groupBy.node'
      }
    ]
  });

  setGroupDefaultType('serviceDiscovery', SERVICE);

  configureType(WORKLOAD, {
    displayName: store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 1 }).trim(),
    location:    {
      name:   'c-cluster-product-resource',
      params: { resource: WORKLOAD },
    },
  });

  headers(PV, [STATE, NAME_COL, RECLAIM_POLICY, PERSISTENT_VOLUME_CLAIM, PERSISTENT_VOLUME_SOURCE, PV_REASON, AGE]);
  headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
  headers(SECRET, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    SUB_TYPE,
    {
      name:      'data',
      labelKey:  'tableHeaders.data',
      value:     'dataPreview',
      formatter: 'SecretData'
    },
    AGE
  ]);
  headers(INGRESS, [STATE, NAME_COL, NAMESPACE_COL, INGRESS_TARGET, INGRESS_DEFAULT_BACKEND, INGRESS_CLASS, AGE]);
  headers(SERVICE, [STATE, NAME_COL, NAMESPACE_COL, TARGET_PORT, SELECTOR, SPEC_TYPE, AGE]);
  headers(EVENT, [STATE, { ...LAST_SEEN_TIME, defaultSort: true }, EVENT_TYPE, REASON, OBJECT, 'Subobject', 'Source', MESSAGE, 'First Seen', 'Count', NAME_COL, NAMESPACE_COL]);
  headers(HPA, [STATE, NAME_COL, HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA, AGE]);
  headers(WORKLOAD, [STATE, NAME_COL, NAMESPACE_COL, TYPE, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.DEPLOYMENT, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.DAEMON_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.REPLICA_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.STATEFUL_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Completions', DURATION, POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.CRON_JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Schedule', 'Last Schedule', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.REPLICATION_CONTROLLER, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(POD, [STATE, NAME_COL, NAMESPACE_COL, POD_IMAGES, 'Ready', 'Restarts', 'IP', NODE_COL, AGE]);
  headers(STORAGE_CLASS, [STATE, NAME_COL, STORAGE_CLASS_PROVISIONER, STORAGE_CLASS_DEFAULT, AGE]);

  headers(RBAC.ROLE, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    AGE
  ]);

  headers(RBAC.CLUSTER_ROLE, [
    STATE,
    NAME_COL,
    AGE,
  ]);

  headers(MANAGEMENT.USER, [
    STATE,
    USER_ID,
    USERNAME,
    USER_DISPLAY_NAME,
    // USER_PROVIDER,
    AGE
  ]);

  virtualType({
    label:      store.getters['i18n/t']('clusterIndexPage.header'),
    group:      'Root',
    namespaced: false,
    name:       'cluster-dashboard',
    weight:     100,
    route:      { name: 'c-cluster-explorer' },
    exact:      true,
    overview:   true,
  });

  virtualType({
    label:          store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 2 }),
    group:          store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 2 }),
    namespaced:     true,
    name:           WORKLOAD,
    weight:         99,
    icon:           'folder',
    ifHaveSubTypes: Object.values(WORKLOAD_TYPES),
    route:          {
      name:   'c-cluster-product-resource',
      params: { resource: WORKLOAD }
    },
    overview: true,
  });

  virtualType({
    label:            store.getters['i18n/t'](`typeLabel.${ NAMESPACE }`, { count: 2 }),
    group:            'cluster',
    icon:             'globe',
    namespaced:       false,
    ifMgmtCluster: false,
    name:             VIRTUAL_TYPES.NAMESPACES,
    weight:           98,
    route:            { name: 'c-cluster-product-namespaces' },
    exact:            true,
  });

  // Ignore these types as they are managed through the settings product
  ignoreType(MANAGEMENT.SETTING);

  // Ignore these types as they are managed through the auth product
  ignoreType(MANAGEMENT.USER);
}
