import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';
import { NODE as NODE_TYPE } from '@shell/config/types';
import { COLUMN_BREAKPOINTS } from '@shell/types/store/type-map';

// Note: 'id' is always the last sort, so you don't have to specify it here.

export const STATE = {
  name:      'state',
  labelKey:  'tableHeaders.state',
  sort:      ['stateSort', 'nameSort'],
  value:     'stateDisplay',
  getValue:  (row) => row.stateDisplay,
  width:     100,
  default:   'unknown',
  formatter: 'BadgeStateFormatter',
};

export const APP_SUMMARY = {
  name:      'summary',
  labelKey:  'tableHeaders.resources',
  value:     'deployedResources.length',
  sort:      false,
  search:    false,
  formatter: 'AppSummaryGraph',
  align:     'center',
  width:     100,
};

export const PHASE = {
  name:     'phase',
  labelKey: 'tableHeaders.phase',
  sort:     ['phaseSort'],
  value:    'status.phase',
  width:    100,
  default:  'unknown',
};

export const DOWNLOAD = {
  name:          'download',
  labelKey:      'tableHeaders.download',
  value:         'download',
  canBeVariable: true,
  align:         'right',
};

export const DEVICE_NAME = {
  name:     'device_name',
  labelKey: 'tableHeaders.deviceName',
  value:    'status.devName',
};

// This header is used for nodes in
// both Cluster Explorer and Cluster Management.
export const INTERNAL_EXTERNAL_IP = {
  // @TODO this is called internal/external but displays external/internal (╯°□°)╯︵ ┻━┻
  name:      'internal-external-ip',
  labelKey:  'tableHeaders.internalExternalIp',
  search:    ['externalIp', 'internalIp'],
  sort:      ['externalIp', 'internalIp'],
  formatter: 'InternalExternalIP',
};

export const NAME = {
  name:          'name',
  labelKey:      'tableHeaders.name',
  value:         'nameDisplay',
  getValue:      (row) => row.nameDisplay,
  sort:          ['nameSort'],
  formatter:     'LinkDetail',
  canBeVariable: true,
};

export const LOGGING_OUTPUT_PROVIDERS = {
  name:      'logging-output-providers',
  labelKey:  'tableHeaders.loggingOutputProviders',
  value:     'providersDisplay',
  sort:      ['providersSortable'],
  formatter: 'List',
};

export const SIMPLE_NAME = {
  name:          'name',
  labelKey:      'tableHeaders.simpleName',
  value:         'name',
  sort:          ['name'],
  width:         200,
  canBeVariable: true,
};

export const EFFECT = {
  name:     'effect',
  labelKey: 'tableHeaders.effect',
  value:    'effect',
  sort:     ['effect'],
};

export const STORAGE_CLASS_PROVISIONER = {
  name:     'storage_class_provisioner',
  labelKey: 'tableHeaders.storage_class_provisioner',
  value:    'provisionerDisplay',
  sort:     ['provisioner'],
};

export const STORAGE_CLASS_DEFAULT = {
  name:      'storage_class_default',
  labelKey:  'tableHeaders.default',
  value:     'isDefault',
  sort:      ['isDefault'],
  formatter: 'Checked',
};

export const PERSISTENT_VOLUME_SOURCE = {
  name:     'persistent_volume_source',
  labelKey: 'tableHeaders.persistentVolumeSource',
  value:    'source',
  sort:     ['provisioner'],
};

export const PERSISTENT_VOLUME_CLAIM = {
  name:          'persistent-volume-claim',
  labelKey:      'tableHeaders.persistentVolumeClaim',
  sort:          ['nameSort'],
  value:         'claimName',
  formatter:     'LinkDetail',
  formatterOpts: { reference: 'claim.detailLocation' },
};

export const OUTPUT = {
  name:          'localOutputRefs',
  labelKey:      'tableHeaders.output',
  value:         'outputs',
  sort:          ['outputsSortable'],
  formatter:     'ListLink',
  formatterOpts: { options: { internal: true } },
};

export const CONFIGURED_PROVIDERS = {
  name:      'providers',
  labelKey:  'tableHeaders.providers',
  value:     'providersDisplay',
  sort:      'providersSortable',
  formatter: 'List',
};

export const CLUSTER_OUTPUT = {
  ...OUTPUT,
  name:     'globalOutputRefs',
  value:    'clusterOutputs',
  sort:     ['clusterOutputsSortable'],
  labelKey: 'tableHeaders.clusterOutput',
};

export const ID_UNLINKED = {
  name:          'id',
  labelKey:      'tableHeaders.id',
  value:         'id',
  sort:          ['id'],
  canBeVariable: true,
};

export const NAME_UNLINKED = {
  name:          'name',
  labelKey:      'tableHeaders.nameUnlinked',
  value:         'nameDisplay',
  sort:          ['nameSort'],
  canBeVariable: true,
};

export const NAMESPACE = {
  name:        'namespace',
  labelKey:    'tableHeaders.namespace',
  value:       'namespace',
  getValue:    (row) => row.namespace,
  sort:        'namespace',
  dashIfEmpty: true,
};

export const NODE = {
  name:          'node',
  labelKey:      'tableHeaders.node',
  value:         'spec.nodeName',
  getValue:      (row) => row.spec?.nodeName,
  sort:          'spec.nodeName',
  formatter:     'LinkName',
  formatterOpts: { type: NODE_TYPE },
};

export const NODE_NAME = {
  name:          'nodeName',
  labelKey:      'tableHeaders.nodeName',
  sort:          'status.nodeName',
  value:         'status.nodeName',
  formatter:     'LinkName',
  formatterOpts: { type: NODE_TYPE },
};

export const ROLES = {
  name:     'roles',
  labelKey: 'tableHeaders.roles',
  sort:     'roles',
  value:    'roles',
};

export const VERSION = {
  name:     'version',
  labelKey: 'tableHeaders.version',
  sort:     'version',
  value:    'version',
  getValue: (row) => row.version,
};

export const CPU = {
  name:      'cpu',
  labelKey:  'tableHeaders.cpu',
  sort:      'cpuUsage',
  search:    false,
  value:     'cpuUsagePercentage',
  formatter: 'PercentageBar',
  width:     120,
};

export const RAM = {
  name:      'ram',
  labelKey:  'tableHeaders.ram',
  sort:      'ramUsage',
  search:    false,
  value:     'ramUsagePercentage',
  formatter: 'PercentageBar',
  width:     120,
};

export const PRINCIPAL = {
  name:      'principal',
  labelKey:  'tableHeaders.name',
  sort:      'principal.loginName',
  value:     'principalId',
  formatter: 'Principal',
};

export const PODS = {
  name:      'pods',
  labelKey:  'tableHeaders.pods',
  sort:      'podConsumed',
  search:    false,
  value:     (row) => row.podConsumedUsage,
  formatter: 'PercentageBar',
  width:     120,
};

export const AGE = {
  name:      'age',
  labelKey:  'tableHeaders.age',
  value:     'creationTimestamp',
  getValue:  (row) => row.creationTimestamp,
  sort:      'creationTimestamp:desc',
  search:    false,
  formatter: 'LiveDate',
  width:     100,
  align:     'left',
};

export const CREATION_DATE = {
  name:      'date',
  labelKey:  'tableHeaders.date',
  value:     'metadata.creationTimestamp',
  sort:      ['date'],
  formatter: 'Date',
};

export const DESCRIPTION = {
  name:     'description',
  labelKey: 'tableHeaders.description',
  align:    'left',
  sort:     ['description'],
  width:    300,
};

export const DURATION = {
  name:      'duration',
  labelKey:  'tableHeaders.duration',
  value:     'duration.value',
  sort:      'duration.seconds',
  formatter: 'LiveDuration',
};

export const IMAGE_NAME = {
  name:      'image',
  labelKey:  'tableHeaders.image',
  value:     'image',
  sort:      ['image', 'nameSort'],
  formatter: 'ImageName',
};

export const POD_IMAGES = {
  name:      'pod_images',
  labelKey:  'tableHeaders.podImages',
  value:     'imageNames',
  getValue:  (row) => row.imageNames,
  sort:      'imageNames',
  // search:    'imageNames',
  formatter: 'PodImages',
};

export const POD_RESTARTS = {
  name:         'pod_restarts',
  labelKey:     'tableHeaders.podRestarts',
  formatter:    'LivePodRestarts',
  delayLoading: true,
  value:        'restartCount',
  getValue:     (row) => row.restartCount,
  // This column is expensive to compute, so don't make it searchable
  search:       false,
  liveUpdates:  true,
};

export const ENDPOINTS = {
  name:      'endpoint',
  labelKey:  'tableHeaders.endpoints',
  value:     'status.endpoints',
  formatter: 'Endpoints',
  width:     60,
  align:     'center',
};

export const SCALE = {
  name:      'scale',
  labelKey:  'tableHeaders.scale',
  value:     'scales.desired',
  sort:      ['scales.desired', 'nameSort'],
  formatter: 'Scale',
  width:     60,
  align:     'center',
};

export const SIMPLE_SCALE = {
  name:     'simple-scale',
  labelKey: 'tableHeaders.simpleScale',
  value:    'scale',
  sort:     ['scale'],
};

export const WEIGHT = {
  name:      'weight',
  labelKey:  'tableHeaders.weight',
  value:     'status.computedWeight',
  sort:      'status.computedWeight',
  formatter: 'Weight',
  width:     60,
  align:     'center',
};

export const SUCCESS = {
  name:     'success',
  labelKey: 'tableHeaders.success',
  value:    'success',
  width:    100,
  align:    'right',
};

export const REQ_RATE = {
  name:     'req-rate',
  labelKey: 'tableHeaders.reqRate',
  value:    'rps',
  width:    100,
  align:    'right',
};

export const P95 = {
  name:     'p95',
  labelKey: 'tableHeaders.p95',
  value:    'p95',
  width:    100,
  align:    'right',
};

export const KEYS = {
  name:     'keys',
  labelKey: 'tableHeaders.keys',
  sort:     false,
  value:    'keysDisplay',
};

export const TARGET_KIND = {
  name:     'target-kind',
  labelKey: 'tableHeaders.targetKind',
  value:    'kindDisplay',
  width:    100,
};

export const TARGET = {
  name:     'target',
  labelKey: 'tableHeaders.target',
  value:    'targetDisplay',
};

export const USERNAME = {
  name:        'username',
  labelKey:    'tableHeaders.username',
  value:       'spec.username',
  dashIfEmpty: true,
  sort:        'username',
};

export const USER_DISPLAY_NAME = {
  name:        'name',
  labelKey:    'tableHeaders.userDisplayName',
  value:       'spec.displayName',
  sort:        ['nameSort'],
  dashIfEmpty: true,
};

export const USER_PROVIDER = {
  name:        'provider',
  labelKey:    'tableHeaders.provider',
  value:       'providerDisplay',
  dashIfEmpty: true,
  sort:        'providerDisplay',
};

export const USER_ID = {
  name:          'user-id',
  labelKey:      'tableHeaders.userId',
  value:         'id',
  formatter:     'LinkDetail',
  canBeVariable: true,
  sort:          'id',
};

export const ADDRESS = {
  name:     'address',
  labelKey: 'tableHeaders.address',
  value:    'address',
  sort:     ['address'],
};

export const SIMPLE_TYPE = {
  name:     'type',
  labelKey: 'tableHeaders.simpleType',
  value:    'type',
  sort:     ['type'],
  width:    175,
};

export const IMAGE_SIZE = {
  name:      'sizeBytes',
  labelKey:  'tableHeaders.imageSize',
  value:     'sizeBytes',
  sort:      ['sizeBytes'],
  formatter: 'Si',
};

export const TYPE = {
  name:     'type',
  labelKey: 'tableHeaders.type',
  value:    'typeDisplay',
  getValue: (row) => row.typeDisplay,
  sort:     ['typeDisplay'],
  width:    100,
};

export const SUB_TYPE = {
  name:     'subType',
  labelKey: 'tableHeaders.subType',
  value:    'subTypeDisplay',
  sort:     ['subTypeDisplay'],
  width:    120,
};

export const EVENT_TYPE = {
  name:     'type',
  labelKey: 'tableHeaders.type',
  value:    'eventType',
  sort:     'eventType',
};

export const STATUS = {
  name:     'status',
  labelKey: 'tableHeaders.status',
  value:    'status',
  sort:     ['status'],
  width:    175,
};

export const LAST_SEEN_TIME = {
  name:     'lastSeen',
  labelKey: 'tableHeaders.lastSeen',
  value:    'lastSeen',
  sort:     'lastTimestamp:desc',
  tooltip:  'tableHeaders.lastSeenTooltip',
};
export const LAST_HEARTBEAT_TIME = {
  name:      'lastHeartbeatTime',
  labelKey:  'tableHeaders.lastSeen',
  value:     'lastHeartbeatTime',
  sort:      ['lastHeartbeatTime'],
  formatter: 'LiveDate',
  width:     175,
};
export const REASON = {
  name:     'reason',
  labelKey: 'tableHeaders.reason',
  value:    'reason',
  sort:     ['reason'],
};
export const OBJECT = {
  name:          'object',
  labelKey:      'tableHeaders.object',
  value:         'involvedObject',
  sort:          ['involvedObject.kind', 'involvedObject.name'],
  canBeVariable: true,
  formatter:     'InvolvedObjectLink',
};
export const RECLAIM_POLICY = {
  name:     'reclaimPolicy',
  labelKey: 'tableHeaders.reclaimPolicy',
  value:    'spec.persistentVolumeReclaimPolicy',
  sort:     ['spec.persistentVolumeReclaimPolicy'],
};
export const PV_REASON = {
  name:     'pvReason',
  labelKey: 'tableHeaders.reason',
  value:    'status.reason',
  sort:     ['status.reason'],
};

export const MESSAGE = {
  name:     'message',
  labelKey: 'tableHeaders.message',
  value:    'message',
  sort:     ['message'],
};
export const KEY = {
  name:     'key',
  labelKey: 'tableHeaders.key',
  value:    'key',
  sort:     ['key'],
};
export const VALUE = {
  name:     'value',
  labelKey: 'tableHeaders.value',
  value:    'value',
  sort:     ['value'],
};

export const BUILT_IN = {
  name:      'builtIn',
  labelKey:  'tableHeaders.builtIn',
  value:     'builtIn',
  sort:      ['builtIn'],
  align:     'center',
  formatter: 'IconIsDefault',
};

export const CLUSTER_CREATOR_DEFAULT = {
  name:      'default',
  labelKey:  'tableHeaders.clusterCreatorDefault',
  value:     'default',
  sort:      ['Default'],
  align:     'center',
  formatter: 'IconIsDefault',
};

export const RBAC_DEFAULT = {
  name:      'default',
  labelKey:  'tableHeaders.default',
  value:     'default',
  formatter: 'Checked',
  sort:      ['default'],
};

export const RBAC_BUILTIN = {
  name:      'builtin',
  labelKey:  'tableHeaders.builtin',
  value:     'builtin',
  formatter: 'Checked',
  sort:      ['builtin'],
};

export const RESOURCE = {
  name:     'resource',
  labelKey: 'tableHeaders.resource',
  value:    'resource',
  sort:     ['resourceNames'],
};

export const API_GROUP = {
  name:     'apigroups',
  labelKey: 'tableHeaders.apiGroup',
  value:    'apiGroups',
  sort:     ['apiGroups'],
};

export const INGRESS_CLASS = {
  name:     'ingressClassName',
  labelKey: 'tableHeaders.ingressClass',
  value:    `$['spec']['ingressClassName']`,
  sort:     `$['spec']['ingressClassName']`,
};

export const INGRESS_DEFAULT_BACKEND = {
  name:      'ingressDefaultBackend',
  labelKey:  'tableHeaders.ingressDefaultBackend',
  value:     'hasDefaultBackend',
  sort:      ['hasDefaultBackend:desc'],
  formatter: 'Checked',
  width:     75,
  align:     'center',
};

export const INGRESS_TARGET = {
  name:      'ingressTarget',
  labelKey:  'tableHeaders.ingressTarget',
  value:     "$['spec']",
  formatter: 'IngressTarget',
  sort:      "$['spec']['rules'][0].host",
};

export const SPEC_TYPE = {
  name:      'type',
  labelKey:  'tableHeaders.type',
  value:     `$['spec']['type']`,
  sort:      `$['spec']['type']`,
  formatter: 'ServiceType',
};

export const TARGET_PORT = {
  formatter: 'ServiceTargets',
  labelKey:  'tableHeaders.targetPort',
  name:      'targetPort',
  sort:      `$['spec']['targetPort']`,
  value:     `$['spec']['targetPort']`,
};

export const SELECTOR = {
  formatter: 'KeyValue',
  name:      'selector',
  labelKey:  'tableHeaders.selector',
  value:     `$['spec']['selector']`,
  sort:      `$['spec']['selector']`,
};

export const CHART = {
  name:     'chart',
  labelKey: 'tableHeaders.chart',
  value:    'chartDisplay',
  sort:     ['chartDisplay', 'versionSort'],
};

export const CHART_UPGRADE = {
  name:        'upgrade',
  labelKey:    'tableHeaders.upgrade',
  value:       'upgradeAvailable',
  sort:        'upgradeAvailableSort:desc',
  dashIfEmpty: true,
};

export const RESOURCES = {
  name:     'resources',
  labelKey: 'tableHeaders.resources',
  value:    'spec.resources.length',
  sort:     'spec.resources.length',
  width:    100,
};

export const URL = {
  name:     'url',
  labelKey: 'tableHeaders.url',
  value:    'spec.url',
  sort:     'spec.url',
};

export const LAST_UPDATED = {
  name:          'lastUpdated',
  labelKey:      'tableHeaders.lastUpdated',
  value:         'lastTransitionTime',
  formatter:     'LiveDate',
  formatterOpts: { addSuffix: true },
  sort:          ['lastTransitionTime'],
};

export const WORKSPACE = {
  name:  'workspace',
  label: 'Workspace',
  value: 'metadata.namespace',
  sort:  ['metadata.namespace', 'nameSort'],
};

export const WORKLOAD_IMAGES = {
  ...POD_IMAGES,
  value:      '',
  breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
};

export const WORKLOAD_ENDPOINTS = {
  name:        'workloadEndpoints',
  labelKey:    'tableHeaders.endpoints',
  value:       `$['metadata']['annotations']['${ CATTLE_PUBLIC_ENDPOINTS }']`,
  getValue:    (row) => row.metadata?.annotations?.[CATTLE_PUBLIC_ENDPOINTS],
  formatter:   'Endpoints',
  dashIfEmpty: true,
  breakpoint:  COLUMN_BREAKPOINTS.DESKTOP,
  maxPageSize: 25, // Hide this column when the page size is bigger than 25
};

export const WORKLOAD_HEALTH_SCALE = {
  name:         'workloadHealthScale',
  labelKey:     'tableHeaders.health',
  formatter:    'WorkloadHealthScale',
  getValue:     () => undefined,
  width:        150,
  skipSelect:   true,
  delayLoading: true,
  // This column is expensive to compute, so don't make it searchable
  search:       false,
  liveUpdates:  true,
};

export const HPA_REFERENCE = {
  name:     'reference',
  labelKey: 'tableHeaders.hpaReference',
  value:    'spec.scaleTargetRef.name',
  sort:     'spec.scaleTargetRef.name',
};

export const MIN_REPLICA = {
  name:     'minimum-replica',
  labelKey: 'tableHeaders.minReplicas',
  value:    'spec.minReplicas',
  sort:     'spec.minReplicas',
};

export const MAX_REPLICA = {
  name:     'maximum-replica',
  labelKey: 'tableHeaders.maxReplicas',
  value:    'spec.maxReplicas',
  sort:     'spec.maxReplicas',
};

export const CURRENT_REPLICA = {
  name:     'current-replica',
  labelKey: 'tableHeaders.currentReplicas',
  value:    'status.currentReplicas',
  sort:     'status.currentReplicas',
};

export const EXPIRY_STATE = {
  ...STATE,
  value:     '$',
  formatter: 'LiveExpiryBadgeState',
};

export const ACCESS_KEY = {
  name:     'id',
  labelKey: 'tableHeaders.accessKey',
  align:    'left',
  sort:     ['name'],
  width:    200,
};

export const SCOPE = {
  name:        'scope',
  value:       'clusterName',
  labelKey:    'tableHeaders.scope',
  dashIfEmpty: true,
  align:       'left',
  sort:        ['scope'],
  width:       100,
};

export const SCOPE_NORMAN = {
  ...SCOPE,
  value: 'clusterId',
  sort:  ['clusterId'],
};

export const EXPIRES = {
  name:      'expires',
  value:     'expiresAt',
  labelKey:  'tableHeaders.expires',
  align:     'left',
  sort:      ['expiresAt'],
  width:     200,
  formatter: 'LiveExpiryDate',
};

export const RESTART = {
  name:      'restart',
  labelKey:  'tableHeaders.restart',
  value:     'restartRequired',
  sort:      ['restartRequired', 'nameSort'],
  formatter: 'Checked',
  width:     75,
  align:     'center',
};

export const KUBE_NODE_OS = {
  name:      'operating-system',
  labelKey:  'tableHeaders.operatingSystem',
  value:     'status.nodeInfo.operatingSystem',
  sort:      ['status.nodeInfo.operatingSystem'],
  formatter: 'Capitalize',
};

export const GPU_DEVICE = {
  name:       'gpu-device',
  labelKey:   'node.list.gpu',
  sort:       'gpu-device',
  width:      120,
  breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
};

export const VRAM = {
  name:     'vram',
  labelKey: 'tableHeaders.vram',
  sort:     'vram',
  search:   false,
  value:    'vram',
};

export const VRAM_ALLOCATED = {
  name:     'vram_allocated',
  labelKey: 'tableHeaders.vramAllocated',
  sort:     'vramAllocated',
  search:   false,
  value:    'vramAllocated',
};

export const VRAM_USAGE = {
  name:      'vram_usage',
  labelKey:  'tableHeaders.vram',
  sort:      'vramUsage',
  search:    false,
  value:     'vramUsagePercentage',
  formatter: 'PercentageBar',
  width:     120,
};

export const VGPU = {
  name:     'vgpu',
  labelKey: 'tableHeaders.vgpu',
  sort:     'vgpu',
  search:   false,
  value:    'vgpu',
};

export const VENDOR = {
  name:        'vendor',
  labelKey:    'tableHeaders.vendor',
  value:       'status.vendor',
  sort:        'vendor',
  dashIfEmpty: true,
};

export const CORES = {
  name:     'cores',
  labelKey: 'tableHeaders.cores',
  sort:     'cores',
  search:   false,
  value:    'cores',
};

export const NOTEBOOK_TYPE = {
  name:      'notebook-type',
  labelKey:  'tableHeaders.notebookType',
  sort:      ['notebook-type'],
  value:     'notebookType',
  formatter: 'ProductTypeIcon',
};

export const API_URL = {
  name:          'api',
  label:         'API URL',
  formatter:     'CopyButton',
  value:         'endpointUrl',
  formatterOpts: { showLabel: false },
};

export const VISIT = {
  name:      'visit',
  labelKey:  'tableHeaders.visit',
  formatter: 'Visit',
  value:     'endpointUrl',
};

export const ACCESS_URL = {
  name:      'access',
  label:     'Access',
  labelKey:  'tableHeaders.access',
  formatter: 'Link',
};

export const CPU_LIMIT = {
  name:     'cpuLimit',
  labelKey: 'tableHeaders.cpu',
  sort:     ['cpuLimit'],
  value:    'cpuLimit',
};

export const MEMORY_LIMIT = {
  name:     'memoryLimit',
  label:    'Memory',
  labelKey: 'tableHeaders.memory',
  sort:     ['memoryLimit'],
  value:    'memoryLimit',
};

export const STATUS_STATE = {
  name:     'status',
  labelKey: 'tableHeaders.status',
  label:    'Status',
  value:    'status.state',
};

export const OPENAI_API_URL = {
  name:          'openaiApiUrl',
  label:         'API URL',
  labelKey:      'tableHeaders.apiUrl',
  formatter:     'copyButton',
  value:         'openaiApiUrl',
  formatterOpts: { showLabel: false },
};

export const INTERNAL_API_URL = {
  name:          'internalApiUrl',
  label:         'Internal URL',
  labelKey:      'tableHeaders.internalUrl',
  value:         'internalApiUrl',
  formatter:     'copyButton',
  formatterOpts: { showLabel: false },
};

export const MODEL_NAME = {
  name:      'modelName',
  label:     'Model Name',
  labelKey:  'tableHeaders.modelName',
  sort:      ['model'],
  value:     'modelName',
  formatter: 'copyButton',
};

export const RAY_VERSION = {
  name:     'rayVersion',
  label:    'Cluster Version',
  labelKey: 'tableHeaders.clusterVersion',
  sort:     ['spec.rayVersion'],
  value:    'spec.rayVersion',
};

export const DEVICE_INDEX = {
  name:     'device-index',
  labelKey: 'tableHeaders.deviceIndex',
  sort:     'device-index',
  search:   false,
  value:    'status.index',
};
