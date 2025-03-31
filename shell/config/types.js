// --------------------------------------
// 1. Provided by Steve and always potentially available
// --------------------------------------

// Steve-specific virtual types
// Base: /v1
export const STEVE = {
  PREFERENCE:        'userpreference',
  SCHEMA_DEFINITION: 'schemaDefinition'
};

// Common native k8s types (via Steve)
// Base: /k8s/clusters/<id>/v1/
export const API_GROUP = 'apiGroups';
export const API_SERVICE = 'apiregistration.k8s.io.apiservice';
export const CONFIG_MAP = 'configmap';
export const COUNT = 'count';
export const EVENT = 'event';
export const ENDPOINTS = 'endpoints';
export const HPA = 'autoscaling.horizontalpodautoscaler';
export const INGRESS = 'networking.k8s.io.ingress';
export const INGRESS_CLASS = 'networking.k8s.io.ingressclass';
export const LIMIT_RANGE = 'limitrange';
export const NAMESPACE = 'namespace';
export const NODE = 'node';
export const NETWORK_POLICY = 'networking.k8s.io.networkpolicy';
export const POD = 'pod';
export const POD_DISRUPTION_BUDGET = 'policy.poddisruptionbudget';
export const PV = 'persistentvolume';
export const PVC = 'persistentvolumeclaim';
export const RESOURCE_QUOTA = 'resourcequota';
export const SCHEMA = 'schema';
export const SERVICE = 'service';
export const SECRET = 'secret';
export const SERVICE_ACCOUNT = 'serviceaccount';
export const STORAGE_CLASS = 'storage.k8s.io.storageclass';
export const CSI_DRIVER = 'storage.k8s.io.csidriver';
export const NETWORK_ATTACHMENT = 'k8s.cni.cncf.io.networkattachmentdefinition';
export const USER = 'user';
export const GROUP = 'group';
export const RUNTIME_CLASS = 'node.k8s.io.runtimeclass';

export const RBAC_GROUP = 'rbac.authorization.k8s.io';
export const RBAC = {
  ROLE:                 'rbac.authorization.k8s.io.role',
  CLUSTER_ROLE:         'rbac.authorization.k8s.io.clusterrole',
  ROLE_BINDING:         'rbac.authorization.k8s.io.rolebinding',
  CLUSTER_ROLE_BINDING: 'rbac.authorization.k8s.io.clusterrolebinding',
};

export const WORKLOAD = 'workload';

// The types that are aggregated into a "workload"
export const WORKLOAD_TYPES = {
  DEPLOYMENT:             'apps.deployment',
  CRON_JOB:               'batch.cronjob',
  DAEMON_SET:             'apps.daemonset',
  JOB:                    'batch.job',
  STATEFUL_SET:           'apps.statefulset',
  REPLICA_SET:            'apps.replicaset',
  REPLICATION_CONTROLLER: 'replicationcontroller',
};

const {
  DAEMON_SET, CRON_JOB, JOB, ...scalableWorkloads
} = WORKLOAD_TYPES;

export const SCALABLE_WORKLOAD_TYPES = scalableWorkloads;

export const LIST_WORKLOAD_TYPES = {
  ...WORKLOAD_TYPES,
  POD
};

export const METRIC = {
  NODE: 'metrics.k8s.io.nodemetrics',
  POD:  'metrics.k8s.io.podmetrics',
};

// --------------------------------------
// 2. Only if LLMOS-Operator is installed
// --------------------------------------

// Management API (via Steve)
// Base: /v1
export const MANAGEMENT_GROUP = 'management.llmos.ai';
export const MANAGEMENT = {
  CLUSTER:               'management.oneblock.ai.cluster',
  SETTING:               'management.llmos.ai.setting',
  USER:                  'management.llmos.ai.user',
  TOKEN:                 'management.llmos.ai.token',
  MANAGED_ADDON:         'management.llmos.ai.managedaddon',
  GLOBAL_ROLE:           'management.llmos.ai.globalrole',
  ROLE_TEMPLATE:         'management.llmos.ai.roletemplate',
  ROLE_TEMPLATE_BINDING: 'management.llmos.ai.roletemplatebinding',

  // TODO, add project
  PROJECT: 'management.llmos.io.project',
};

export const LLMOS = {
  VERSION:   'v1',
  GPUDEVICE: 'gpustack.llmos.ai.gpudevice',
  VOLUME:    'llmos.ai.volume',
  CHAT:      'chat',
  TOOL:      'llmos.tool',
};

export const ML_WORKLOAD = 'ml_workload';
export const ML_WORKLOAD_TYPES = {
  RAY_CLUSTER:   'ray.io.raycluster',
  MODEL_SERVICE: 'ml.llmos.ai.modelservice',
  NOTEBOOK:      'ml.llmos.ai.notebook',
};

export const ML_SCALABLE_WORKLOAD_TYPES = {};

export const ML_LIST_WORKLOAD_TYPES = { ...ML_WORKLOAD_TYPES };

export const VIRTUAL_TYPES = { NAMESPACES: 'namespaces' };

export const DEFAULT_WORKSPACE = 'llmos-system';

// nvidia CRDs
export const NVIDIA = {
  CLUSTER_POLICY: 'nvidia.com.clusterpolicy',
  NVIDIA_DRIVER:  'nvidia.com.nvidiadriver',
};

// rook ceph CRDs
export const CEPH = {
  CEPH_CLUSTER:    'ceph.rook.io.cephcluster',
  CEPH_FILESYSTEM: 'ceph.rook.io.cephfilesystem',
  CEPH_BLOCK_POOL: 'ceph.rook.io.cephblockpool',
};

export const MONITORING = {
  ALERTMANAGER:        'monitoring.coreos.com.alertmanager',
  ALERTMANAGER_CONFIG: 'monitoring.coreos.com.alertmanagerconfig',
  PROMETHEUS:          'monitoring.coreos.com.prometheus',
  PROMETHEUS_RULE:     'monitoring.coreos.com.prometheusrule',
  SERVICE_MONITOR:     'monitoring.coreos.com.servicemonitor',
  POD_MONITOR:         'monitoring.coreos.com.podmonitor',
  THANOS_RULER:        'monitoring.coreos.com.thanosruler',
};

export const AUTH_TYPE = {
  _NONE:  '_none',
  _BASIC: '_basic',
  _SSH:   '_ssh',
  _S3:    '_S3'
};

export const DEFAULT_GRAFANA_STORAGE_SIZE = '10Gi';

export const CATALOG = {
  CLUSTER_REPO: 'catalog.cattle.io.clusterrepo',
  OPERATION:    'catalog.cattle.io.operation',
  APP:          'catalog.cattle.io.app',
  REPO:         'catalog.cattle.io.repo',
};
