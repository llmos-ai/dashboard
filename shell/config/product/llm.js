import { DSL } from '@shell/store/type-map';
import { MANAGEMENT } from '@shell/config/types';

export const NAME = 'llm';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    configureType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)*llmos\.ai$/,
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
    label:      'Model Files',
    group:      'Root',
    name:       MANAGEMENT.MODELFILE,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: MANAGEMENT.MODELFILE }
    },
    exact: false,
    weight: 99,
  });


  virtualType({
    label:      'Chats',
    group:      'Root',
    name:       MANAGEMENT.CHAT,
    namespaced: true,
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: MANAGEMENT.CHAT }
    },
    exact: false,
    weight: 100,
  });

  basicType([
    MANAGEMENT.MODELFILE,
    MANAGEMENT.CHAT
  ]);
}
