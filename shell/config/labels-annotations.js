// export const NORMAN_NAME = 'field.cattle.io/name';
export const DESCRIPTION = 'field.cattle.io/description';
export const HOSTNAME = 'kubernetes.io/hostname';
export const TIMESTAMP = 'cattle.io/timestamp';
export const SYSTEM_NAMESPACE = 'management.cattle.io/system-namespace';
export const PROJECT = 'field.cattle.io/projectId';
export const CONTAINER_DEFAULT_RESOURCE_LIMIT = 'field.cattle.io/containerDefaultResourceLimit';
export const CATTLE_PUBLIC_ENDPOINTS = 'field.cattle.io/publicEndpoints';
export const TARGET_WORKLOADS = 'field.cattle.io/targetWorkloadIds';
export const UI_MANAGED = 'management.cattle.io/ui-managed';
export const RESOURCE_QUOTA = 'field.cattle.io/resourceQuota';
export const WORKSPACE_ANNOTATION = 'objectset.rio.cattle.io/id';

export const KUBERNETES = {
  SERVICE_ACCOUNT_UID:  'kubernetes.io/service-account.uid',
  SERVICE_ACCOUNT_NAME: 'kubernetes.io/service-account.name',
  MANAGED_BY:           'app.kubernetes.io/managed-by',
  MANAGED_NAME:         'app.kubernetes.io/name',
  INSTANCE:             'app.kubernetes.io/instance',
};

export const CERTMANAGER = { ISSUER: 'cert-manager.io/issuer-name' };

export const STORAGE = {
  DEFAULT_STORAGE_CLASS:      'storageclass.kubernetes.io/is-default-class',
  BETA_DEFAULT_STORAGE_CLASS: 'storageclass.beta.kubernetes.io/is-default-class'
};

export const NODE_ROLES = {
  CONTROL_PLANE_OLD: 'node-role.kubernetes.io/controlplane',
  CONTROL_PLANE:     'node-role.kubernetes.io/control-plane',
  WORKER:            'node-role.kubernetes.io/worker',
  ETCD:              'node-role.kubernetes.io/etcd',
};

export const RKE = { EXTERNAL_IP: 'rke.cattle.io/external-ip' };

export const ISTIO = { AUTO_INJECTION: 'istio-injection' };

const CATTLE_REGEX = /cattle\.io\//;
const LLMOS_REGEX = /cattle\.io\//;

export const LABELS_TO_IGNORE_REGEX = [
  CATTLE_REGEX, LLMOS_REGEX
];

export const ANNOTATIONS_TO_IGNORE_REGEX = [
  CATTLE_REGEX, LLMOS_REGEX
];

export const ANNOTATIONS_TO_FOLD = [
  /^kubectl\.kubernetes\.io\/.*$/,
];

// Annotations that can be on management.cattle.io.cluster to configure a custom badge
// Can't use ui.cattle.io - it seems to strip these out - so using io.rancher
export const CLUSTER_BADGE = {
  // Badge text - badge is only shown if badge text is not empty
  TEXT:      'ui.rancher/badge-text',
  // Badge color - as a hex color - e.g. #ff00ff
  COLOR:     'ui.rancher/badge-color',
  // Custom icon text - max 2 characters
  ICON_TEXT: 'ui.rancher/badge-icon-text',
};

export const SYSTEM_LABELS = [
  'io.cattle.lifecycle.',
  'beta.kubernetes.io',
  'failure-domain.beta.kubernetes.io',
  'node-role.kubernetes.io',
  'kubernetes.io',
  'cattle.io',
  'authz.management.cattle.io',
  'rke.cattle.io',
  'field.cattle.io',
  'workload.user.cattle.io',
  'k3s.io',
  'node.kubernetes.io',
  'egress.rke2.io',
  'llmos.ai'
];
