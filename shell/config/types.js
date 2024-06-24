// --------------------------------------
// 1. Provided by Steve and always potentially available
// --------------------------------------

// Steve-specific virtual types
// Base: /v1
export const STEVE = { PREFERENCE: 'userpreference' };

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
  NODE: 'metrics.k8s.io.node',
  POD:  'metrics.k8s.io.pod',
};

// --------------------------------------
// 2. Only if LLMOS-Operator is installed
// --------------------------------------

// Management API (via Steve)
// Base: /v1
export const MANAGEMENT = {
  CLUSTER:   'management.cattle.io.cluster',
  SETTING:   'management.llmos.ai.setting',
  USER:      'management.llmos.ai.user',
  MODELFILE: 'ml.llmos.ai.modelfile',
  CHAT:      'chat',
  //TODO, add project
  PROJECT: 'management.llmos.io.project',
  // ML related resources
};

export const VIRTUAL_TYPES = {
  NAMESPACES:         'namespaces'
};

export const DEFAULT_WORKSPACE = 'default';

export const AUTH_TYPE = {
  _NONE:  '_none',
  _BASIC: '_basic',
  _SSH:   '_ssh',
  _S3:    '_S3'
};
