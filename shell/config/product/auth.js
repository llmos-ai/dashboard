import { DSL } from '@shell/store/type-map';
import { MANAGEMENT } from '@shell/config/types';

export const NAME = 'auth';
export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          MANAGEMENT.USER,
    ifHaveVerb:          'GET',
    inStore:             'management',
    icon:                'user',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
  });

  configureType(MANAGEMENT.USER, { showListMasthead: false });
  virtualType({
    labelKey:   'typeLabel."management.llmos.ai.user"',
    name:       MANAGEMENT.USER,
    namespaced: false,
    weight:     103,
    icon:       'user',
    route:      {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  'local',
        product:  NAME,
        resource: MANAGEMENT.USER,
      }
    }
  });

  basicType([
    'config',
    MANAGEMENT.USER,
  ]);
}
