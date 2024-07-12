import { DSL } from '@shell/store/type-map';
import {
  ML_CLUSTER, NAMESPACE, NODE, VIRTUAL_TYPES, PVC, STORAGE_CLASS,
} from '@shell/config/types';

export const NAME = 'llm';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    weightGroup,
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^ml(.*\.)*llmos\.ai$/,
    icon:                NAME,
    showNamespaceFilter: true,
    hideKubeShell:       true,
    hideKubeConfig:      true,
    showClusterSwitcher: false,
    iconHeader:          require(`~shell/assets/images/pl/llm.svg`),
    hideCopyConfig:      true,
    category:            NAME,
  });

  virtualType({
    ifHaveType: NODE,
    label:      'Nodes',
    group:      'Root',
    name:       NODE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: NODE }
    },
    exact:  false,
    weight: 110,
  });

  virtualType({
    label:         store.getters['i18n/t'](`typeLabel.${ NAMESPACE }`, { count: 2 }),
    group:         'Root',
    icon:          'globe',
    namespaced:    false,
    ifMgmtCluster: false,
    name:          VIRTUAL_TYPES.NAMESPACES,
    weight:        101,
    route:         { name: 'c-cluster-product-namespaces' },
    exact:         true,
  });

  virtualType({
    label:      'ML Clusters',
    group:      'Root',
    name:       ML_CLUSTER.RAY_CLUSTER,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_CLUSTER.RAY_CLUSTER }
    },
    exact:  false,
    weight: 100,
  });

  virtualType({
    label:      'Model Files',
    group:      'Root',
    name:       ML_CLUSTER.MODEL_FILE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_CLUSTER.MODEL_FILE }
    },
    exact:  false,
    weight: 99,
  });

  virtualType({
    label:      'Notebooks',
    group:      'Root',
    name:       ML_CLUSTER.NOTEBOOK,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_CLUSTER.NOTEBOOK }
    },
    exact:  false,
    weight: 98,
  });

  basicType([
    ML_CLUSTER.RAY_CLUSTER,
    ML_CLUSTER.MODEL_FILE,
    ML_CLUSTER.NOTEBOOK,
    NODE,
  ]);

  virtualType({
    ifHaveType: ML_CLUSTER.CLUSTER_POLICY,
    label:      'Cluster Policy',
    group:      'GPU Management',
    name:       ML_CLUSTER.CLUSTER_POLICY,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_CLUSTER.CLUSTER_POLICY }
    },
    exact:  false,
    weight: 200,
  });

  // nvidia pages
  basicType(
    [
      ML_CLUSTER.CLUSTER_POLICY,
      ML_CLUSTER.NVIDIA_DRIVER,
    ],
    'GPU Management'
  );

  virtualType({
    ifHaveType: NAMESPACE,
    label:      'Namespaces',
    group:      'Root',
    name:       NAMESPACE,
    namespaced: false,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: NAMESPACE }
    },
    exact:  false,
    weight: 300,
  });

  virtualType({
    ifHaveType: PVC,
    label:      'Volumes',
    group:      'Root',
    name:       PVC,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: PVC }
    },
    exact:  false,
    weight: 301,
  });

  // advanced pages
  basicType(
    [
      NAMESPACE,
      PVC,
      STORAGE_CLASS,
    ],
    'advanced',
  );

  weightGroup('gpu management', 99, true);
  weightGroup('advanced', 98, true);
}
