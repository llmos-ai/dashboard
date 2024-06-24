export const SCOPED_RESOURCES = {
  // With this hardcoded list, it will be easier to curate a more useful
  // and human-understandable list of resources to choose from
  // when creating a role. The list is not meant to be a
  // comprehensive list, but a helpful guide.

  // Cluster scoped roles and project scoped roles
  // are intended to restrict users, so the resource list
  // in the global role creation form includes the largest resource
  // list.

  // The cluster role creation form includes a subset of
  // the global scoped list, and the project role creation form includes a
  // subset of the cluster scoped list.

  globalScopedApiGroups: {
    // Global scoped resources are resources for global apps,
    // mainly Cluster Management.
    // A global role can include everything at the global
    // scope, plus everything in the cluster and project scope.
    'cluster.x-k8s.io': {
      resources: [
        'Clusters'
      ]
    },
  },
  clusterScopedApiGroups: {
    // Cluster scoped resources are for non-namespaced
    // resources at the cluster level, for example,
    // storage resources.
    // A cluster role can include everything at the cluster
    // scope, plus everything in the project scope.
    coreKubernetesApi: {
      resources: [
        // Core K8s API - Non-namespaced resources.
        // These resources do not have an API group.
        'APIGroups',
        'Node',
        'PersistentVolumes',
        'ResourceQuotas',
      ],
      deprecatedResources: [
        'ComponentStatuses', // A deprecated API that provided status of etcd, kube-scheduler, and kube-controller-manager components
      ]
    },
    'admissionregistration.k8s.io': {
      resources: [
        'MutatingWebhookConfigurations',
        'ValidatingWebhookConfigurations',
      ],
    },
    'apiextensions.k8s.io': {
      resources: [
        'CustomResourceDefinitions',
      ]
    },
    'apiregistration.k8s.io': {
      resources: [
        'APIServices'
      ]
    },
    'certificates.k8s.io': {
      resources: [
        'CertificateSigningRequests'
      ]
    },
    'rbac.authorization.k8s.io': {
      resources: [
        'ClusterRoles',
        'ClusterRoleBindings',
        'Roles',
        'RoleBindings',
      ]
    },
    'config.gatekeeper.sh': {
      resources: [
        'Configs'
      ]
    },
    'scheduling.k8s.io': {
      resources: [
        'PriorityClasses',
      ],
    },
    'storage.k8s.io': {
      resources: [
        'CSIDrivers',
        'CSINodes',
        'CSIStorageCapacitys',
        'StorageClasses',
        'VolumeAttachments',
      ]
    }
  },
  projectScopedApiGroups: {
    // Project scoped resources include all other namespaced
    // resources.
    coreKubernetesApi: {
      resources: [
        // Core K8s API - Namespaced resources
        // that are not in an API group.
        'ConfigMaps',
        'LimitRanges', // enumerates compute resource constraints in a project at the pod, container, image, image stream, and persistent volume claim level
        'Namespaces',
        'PersistentVolumeClaims',
        'Pods',
        'PodTemplates',
        'ReplicationControllers',
        'Secrets',
        'Services',
        'ServiceAccounts',
      ],
    },
    apps: {
      resources: [
        'ControllerRevisions',
        'DaemonSets',
        'Deployments',
        'ReplicaSets',
        'StatefulSets',
      ]
    },
    autoscaling: {
      resources: [
        'HorizontalPodAutoscalers',
      ]
    },
    batch: {
      resources: [
        'CronJobs',
        'Jobs',
      ]
    },
    'constraints.gatekeeper.sh': {
      resources: [
        'K8sAllowedRepos',
        'K8sRequiredLabels',
        'Constraints',
      ]
    },
    'templates.gatekeeper.sh': {
      resources: [
        'ConstraintTemplates'
      ]
    },
    'coordination.k8s.io': {
      resources: [
        'Leases',
      ]
    },
    'events.k8s.io': {
      resources: [
        'Events',
      ]
    },
    'monitoring.coreos.com': {
      resources: [
        'Alertmanagers',
        'AlertmanagerConfigs',
        'PodMonitors',
        'Probes',
        'Prometheuses',
        'PrometheusRules',
        'Routes',
        'Receivers',
        'ServiceMonitors',
        'ThanosRulers'
      ]
    },
    'networking.k8s.io': {
      resources: [
        'Ingresses',
        'IngressClasses',
        'NetworkPolicies',
      ]
    },
    'io.k8s.api.discovery': {
      resources: [
        'Endpoints'
      ]
    },
    'discovery.k8s.io': {
      resources: [
        'EndpointSlices',
      ]
    },
    'node.k8s.io': {
      resources: [
        'RuntimeClasses',
      ]
    },
    policy: {
      resources: [
        'PodDisruptionBudgets',
        'PodSecurityPolicies',
      ]
    },
    'status.gatekeeper.sh': {
      resources: [
        'ConstraintPodStatuses',
        'ConstraintTemplatePodStatuses',
      ]
    },
    'networking.istio.io': {
      resources: [
        'DestinationRules',
        'EnvoyFilters',
        'Gateways',
        'ServiceEntries',
        'Sidecars',
        'VirtualServices',
        'WorkloadEntries',
        'WorkloadGroups'
      ]
    }
  }
};
