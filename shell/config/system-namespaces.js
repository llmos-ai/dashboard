// These are used to determine what is considered a User vs System namespace in the namespace picker,
// along with the `isSystem` property of the project associated with the namespace, if in Rancher mode.
export default [
  'ingress-nginx',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'linkerd',
  'security-scan',
  'tekton-pipelines',
  'ceph-system',
  'llmos-system',
  'system-upgrade',
];
