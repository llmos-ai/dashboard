import { DSL } from '@shell/store/type-map';
import { MANAGEMENT } from '@shell/config/types';

export const NAME = 'settings';

export function init(store) {
  const {
    product,
    basicType,
    configureType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveType:          new RegExp(`${ MANAGEMENT.SETTING }`, 'i'),
    inStore:             'management',
    icon:                'globe',
    removable:           false,
    showClusterSwitcher: false,
    category:            'configuration',
    weight:              100,
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'advancedSettings.label',
    name:       'settings',
    namespaced: false,
    weight:     100,
    icon:       'folder',
    route:      {
      name:   'c-cluster-product-resource',
      params: {
        product:  NAME,
        resource: MANAGEMENT.SETTING
      }
    }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'branding.label',
    name:       'brand',
    namespaced: false,
    weight:     98,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-brand' }
  });

  virtualType({
    ifHaveType: MANAGEMENT.SETTING,
    labelKey:   'customLinks.label',
    name:       'links',
    namespaced: false,
    weight:     96,
    icon:       'folder',
    route:      { name: 'c-cluster-settings-links' }
  });

  basicType([
    'settings',
    'brand',
    'banners',
    'links'
  ]);

  configureType(MANAGEMENT.SETTING, {
    isCreatable: false,
    isRemovable: false,
    showAge:     false,
    showState:   false,
    canYaml:     false,
  });
}
