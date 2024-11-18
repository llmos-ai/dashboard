import { DSL } from '@shell/store/type-map';
import {
  LLMOS,
  NAMESPACE,
  NODE,
  VIRTUAL_TYPES,
  PVC,
  STORAGE_CLASS,
  SECRET,
  CONFIG_MAP,
  MANAGEMENT,
  ML_WORKLOAD_TYPES, CEPH, NVIDIA
} from '@shell/config/types';

import {
  STATE,
  NAME as NAME_COL,
  NAMESPACE as NAMESPACE_COL,
  AGE,
  WORKLOAD_HEALTH_SCALE,
  NOTEBOOK_TYPE,
  CPU_LIMIT,
  MEMORY_LIMIT,
  OPENAI_API_URL, MODEL_NAME, INTERNAL_API_URL, ACCESS_URL, RAY_VERSION, VGPU, VRAM, API_URL, VISIT,
} from '@shell/config/table-headers';

export const NAME = 'llmos';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
    weightGroup,
    headers,
  } = DSL(store, NAME);

  product({
    icon:                NAME,
    showNamespaceFilter: true,
    hideKubeShell:       true,
    hideKubeConfig:      true,
    showClusterSwitcher: false,
    iconHeader:          require(`~shell/assets/images/pl/llm.svg`),
    hideCopyConfig:      true,
    category:            NAME,
  });

  configureType(NODE, {
    isCreatable: true, isEditable: true, createButtonLabel: 'import'
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
    ifHaveType: ML_WORKLOAD_TYPES.RAY_CLUSTER,
    labelKey:   'typeLabel."ray.io.raycluster"',
    group:      'Root',
    name:       ML_WORKLOAD_TYPES.RAY_CLUSTER,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_WORKLOAD_TYPES.RAY_CLUSTER }
    },
    exact:  false,
    weight: 100,
  });

  virtualType({
    ifHaveType: ML_WORKLOAD_TYPES.NOTEBOOK,
    label:      'Notebooks',
    group:      'Root',
    name:       ML_WORKLOAD_TYPES.NOTEBOOK,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_WORKLOAD_TYPES.NOTEBOOK }
    },
    exact:  false,
    weight: 99,
  });

  virtualType({
    ifHaveType: ML_WORKLOAD_TYPES.MODEL_SERVICE,
    labelKey:   'typeLabel."ml.llmos.ai.modelservice"',
    group:      'Root',
    name:       ML_WORKLOAD_TYPES.MODEL_SERVICE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: ML_WORKLOAD_TYPES.MODEL_SERVICE }
    },
    exact:  false,
    weight: 98,
  });

  basicType([
    ML_WORKLOAD_TYPES.RAY_CLUSTER,
    ML_WORKLOAD_TYPES.NOTEBOOK,
    ML_WORKLOAD_TYPES.MODEL_SERVICE,
    NODE,
  ]);

  virtualType({
    ifHaveType: NVIDIA.CLUSTER_POLICY,
    labelKey:   'typeLabel."nvidia.com.clusterpolicy"',
    group:      'GPUManagement',
    name:       NVIDIA.CLUSTER_POLICY,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: NVIDIA.CLUSTER_POLICY }
    },
    exact:  false,
    weight: 200,
  });

  configureType(LLMOS.GPUDEVICE, { isCreatable: false, isEditable: true });
  virtualType({
    ifHaveType: LLMOS.GPUDEVICE,
    labelKey:   'typeLabel."gpustack.llmos.ai.gpudevice"',
    group:      'GPUManagement',
    name:       LLMOS.GPUDEVICE,
    namespaced: false,
    route:      {
      name:   `c-cluster-product-resource`,
      params: {
        resource: LLMOS.GPUDEVICE,
        product:  NAME
      }
    },
    exact:  false,
    weight: 201,
  });

  // nvidia pages
  basicType(
    [
      NVIDIA.CLUSTER_POLICY,
      LLMOS.GPUDEVICE,
    ],
    'GPUManagement'
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
    weight: 330,
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
    weight: 320,
  });

  configureType(CEPH.CEPH_CLUSTER, { isCreatable: false });
  virtualType({
    ifHaveType: CEPH.CEPH_CLUSTER,
    labelKey:   'typeLabel."ceph.rook.io.cephcluster"',
    group:      'Storage',
    name:       CEPH.CEPH_CLUSTER,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CEPH.CEPH_CLUSTER }
    },
    exact:  false,
    weight: 313,
  });

  virtualType({
    ifHaveType: CEPH.CEPH_BLOCK_POOL,
    labelKey:   'typeLabel."ceph.rook.io.cephblockpool"',
    group:      'Storage',
    name:       CEPH.CEPH_BLOCK_POOL,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CEPH.CEPH_BLOCK_POOL }
    },
    exact:  false,
    weight: 312,
  });

  virtualType({
    ifHaveType: CEPH.CEPH_FILESYSTEM,
    labelKey:   'typeLabel."ceph.rook.io.cephfilesystem"',
    group:      'Storage',
    name:       CEPH.CEPH_FILESYSTEM,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CEPH.CEPH_FILESYSTEM }
    },
    exact:  false,
    weight: 311,
  });
  basicType(
    [
      LLMOS.VOLUME,
      STORAGE_CLASS,
      CEPH.CEPH_CLUSTER,
      CEPH.CEPH_BLOCK_POOL,
      CEPH.CEPH_FILESYSTEM,
    ],
    'Storage',
  );

  // advanced tab
  virtualType({
    ifHaveType: NAMESPACE,
    label:      'Namespaces',
    labelKey:   'namespace.label',
    group:      'advanced',
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
    group:      'advanced',
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

  weightGroup('GPUManagement', 100, true);
  weightGroup('Storage', 99, true);
  weightGroup('advanced', 98, true);

  headers(ML_WORKLOAD_TYPES.RAY_CLUSTER, [STATE, NAME_COL, NAMESPACE_COL, ACCESS_URL, RAY_VERSION, CPU_LIMIT, MEMORY_LIMIT, API_URL, VGPU, VRAM, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(ML_WORKLOAD_TYPES.NOTEBOOK, [STATE, NAME_COL, NAMESPACE_COL, VISIT, NOTEBOOK_TYPE, CPU_LIMIT, MEMORY_LIMIT, VGPU, VRAM, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(ML_WORKLOAD_TYPES.MODEL_SERVICE, [STATE, NAME_COL, NAMESPACE_COL, OPENAI_API_URL, MODEL_NAME, INTERNAL_API_URL, CPU_LIMIT, MEMORY_LIMIT, VGPU, VRAM, AGE, WORKLOAD_HEALTH_SCALE]);
}
