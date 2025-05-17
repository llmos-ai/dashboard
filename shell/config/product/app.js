import { DSL } from '@shell/store/type-map';

export const NAME = 'apps';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
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
    name:       'app-data',
    namespaced: false,
    weight:     98,
    icon:       'folder',
    route:      {
      name:   `c-cluster-apps-dataCenter`,
      params: { cluster: 'local' }
    },
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

  basicType([
    'app-manage',
    'app-data',
    'app-knowledge'
  ]);
}
