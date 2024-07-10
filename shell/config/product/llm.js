import { DSL } from '@shell/store/type-map';
import { CLUSTER } from '@shell/config/types';

export const NAME = 'llm';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    configureType,
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
    label:      'ML Clusters',
    group:      'Root',
    name:       CLUSTER.RAY_CLUSTER,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CLUSTER.RAY_CLUSTER }
    },
    exact: false,
    weight: 100,
  });

  virtualType({
    label:      'Model Files',
    group:      'Root',
    name:       CLUSTER.MODEL_FILE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CLUSTER.MODEL_FILE }
    },
    exact: false,
    weight: 99,
  });

  virtualType({
    label:      'Notebooks',
    group:      'Root',
    name:       CLUSTER.NOTEBOOK,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: CLUSTER.NOTEBOOK }
    },
    exact: false,
    weight: 98,
  });


  // virtualType({
  //   label:      'Chats',
  //   group:      'Root',
  //   name:       MANAGEMENT.CHAT,
  //   namespaced: true,
  //   route:      {
  //     name:   `c-cluster-product-resource`,
  //     params: { resource: MANAGEMENT.CHAT }
  //   },
  //   exact: false,
  //   weight: 100,
  // });

  basicType([
    CLUSTER.RAY_CLUSTER,
    CLUSTER.MODEL_FILE,
    CLUSTER.NOTEBOOK,
    // MANAGEMENT.CHAT
  ]);
}
