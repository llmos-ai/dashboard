import { DSL } from '@shell/store/type-map';
import {
  LLMOS, NAMESPACE, NODE, VIRTUAL_TYPES, PVC, STORAGE_CLASS, SECRET, CONFIG_MAP, MANAGEMENT
} from '@shell/config/types';

export const NAME = 'llmos';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
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
    labelKey:   'typeLabel."node"',
    group:      'Root',
    name:       NODE,
    namespaced: false,
    route:      {
      name:   `c-cluster-product-resource`,
      params: {
        resource: NODE,
        product:  NAME
      }
    },
    exact:  false,
    weight: 110,
  });

  virtualType({
    ifHaveType:    NAMESPACE,
    label:         store.getters['i18n/t'](`typeLabel.${ NAMESPACE }`, { count: 2 }),
    icon:          'globe',
    namespaced:    false,
    ifMgmtCluster: false,
    name:          VIRTUAL_TYPES.NAMESPACES,
    weight:        101,
    route:         { name: 'c-cluster-product-namespaces' },
    exact:         true,
  });

  virtualType({
    ifHaveType: LLMOS.RAY_CLUSTER,
    labelKey:   'typeLabel."ray.io.raycluster"',
    group:      'Root',
    name:       LLMOS.RAY_CLUSTER,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.RAY_CLUSTER }
    },
    exact:  false,
    weight: 100,
  });

  virtualType({
    ifHaveType: LLMOS.NOTEBOOK,
    label:      'Notebooks',
    group:      'Root',
    name:       LLMOS.NOTEBOOK,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.NOTEBOOK }
    },
    exact:  false,
    weight: 99,
  });

  virtualType({
    ifHaveType: LLMOS.MODEL_SERVICE,
    labelKey:   'typeLabel."ml.llmos.ai.modelservice"',
    group:      'Root',
    name:       LLMOS.MODEL_SERVICE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.MODEL_SERVICE }
    },
    exact:  false,
    weight: 98,
  });

  basicType([
    LLMOS.RAY_CLUSTER,
    LLMOS.NOTEBOOK,
    LLMOS.MODEL_SERVICE,
    NODE,
  ]);

  virtualType({
    ifHaveType: LLMOS.CLUSTER_POLICY,
    labelKey:   'typeLabel."nvidia.com.clusterpolicy"',
    group:      'GPU Management',
    name:       LLMOS.CLUSTER_POLICY,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.CLUSTER_POLICY }
    },
    exact:  false,
    weight: 200,
  });

  // nvidia pages
  basicType(
    [
      LLMOS.CLUSTER_POLICY,
      LLMOS.NVIDIA_DRIVER,
    ],
    'GPU Management'
  );

  // volume management tab
  configureType(LLMOS.VOLUME, {
    ifHaveType: PVC,
    location:   {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.VOLUME }
    },
    resource:       PVC,
    resourceDetail: LLMOS.VOLUME,
    resourceEdit:   LLMOS.VOLUME
  });
  virtualType({
    ifHaveType: PVC,
    labelKey:   'typeLabel."llmos.ai.volume"',
    group:      'Storage',
    name:       LLMOS.VOLUME,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.VOLUME }
    },
    exact:  false,
    weight: 301,
  });
  virtualType({
    ifHaveType: STORAGE_CLASS,
    labelKey:   'typeLabel."storage.k8s.io.storageclass"',
    group:      'Storage',
    name:       STORAGE_CLASS,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: STORAGE_CLASS }
    },
    exact:  false,
    weight: 300,
  });

  basicType(
    [
      LLMOS.VOLUME,
      STORAGE_CLASS,
      LLMOS.CEPH_CLUSTER,
      LLMOS.CEPH_BLOCK_POOL,
      LLMOS.CEPH_FILESYSTEM,
    ],
    'Storage',
  );

  // advanced tab
  virtualType({
    ifHaveType: NAMESPACE,
    label:      'Namespaces',
    labelKey:   'namespace.label',
    group:      'Advanced',
    name:       NAMESPACE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: NAMESPACE }
    },
    exact:  false,
    weight: 110,
  });

  virtualType({
    ifHaveType: MANAGEMENT.MANAGED_ADDON,
    labelKey:   'typeLabel."management.llmos.ai.managedaddon"',
    group:      'Advanced',
    name:       MANAGEMENT.MANAGED_ADDON,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: MANAGEMENT.MANAGED_ADDON }
    },
    exact:  false,
    weight: 100,
  });

  basicType(
    [
      MANAGEMENT.MANAGED_ADDON,
      NAMESPACE,
      SECRET,
      CONFIG_MAP,
    ],
    'advanced',
  );

  weightGroup('storage', 100, true);
  weightGroup('gpu management', 99, true);
  weightGroup('advanced', 98, true);
}
