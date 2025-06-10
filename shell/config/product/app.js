import { DSL } from '@shell/store/type-map';
import { LLMOS } from '@shell/config/types';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    configureType,
  } = DSL(store, NAME);

  product({
    icon:                'app-store',
    removable:           false,
    showClusterSwitcher: false,
    category:            'apps',
    inStore:             'management',
  });

  virtualType({
    labelKey:   'apps.manage.label',
    name:       'app-manage',
    namespaced: false,
    weight:     100,
    icon:       'folder',
    route:      {
      name:   `c-cluster-apps-manage`,
      params: { cluster: 'local' }
    },
  });

  virtualType({
    labelKey:   'apps.data.label',
    name:       'apps.dataset',
    namespaced: false,
    weight:     98,
    icon:       'folder',
    route:      {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.DATASET }
    },
  });

  configureType('apps.dataset', {
    location: {
      name:   `c-cluster-product-resource`,
      params: { resource: LLMOS.DATASET }
    },
    resource:       LLMOS.DATASET,
    resourceDetail: 'apps.dataset',
    resourceEdit:   'apps.dataset',
    isCreatable:    true,
  });

  virtualType({
    labelKey:   'apps.knowledge.label',
    name:       'app-knowledge',
    namespaced: false,
    weight:     96,
    icon:       'folder',
    route:      {
      name:   `c-cluster-apps-knowledgeBase`,
      params: { cluster: 'local' }
    },
  });

  virtualType({
    labelKey:   'apps.trace.label',
    name:       'app-trace',
    namespaced: false,
    weight:     90,
    icon:       'folder',
    route:      {
      name:   `c-cluster-apps-trace`,
      params: { cluster: 'local' }
    },
  });

  basicType([
    'app-manage',
    'apps.dataset',
    'app-knowledge',
    'app-trace'
  ]);
}
