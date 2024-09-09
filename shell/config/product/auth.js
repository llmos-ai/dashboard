import { DSL } from '@shell/store/type-map';
import { MANAGEMENT } from '@shell/config/types';
import {
  RBAC_BUILTIN, RBAC_DEFAULT, STATE, AGE, SIMPLE_NAME,
  NAME as HEADER_NAME
} from '@shell/config/table-headers';

export const NAME = 'auth';

const USERS_VIRTUAL_TYPE = 'users';
const ROLES_VIRTUAL_TYPE = 'roles';

export function init(store) {
  const {
    product,
    headers,
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
    name:       USERS_VIRTUAL_TYPE,
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

  virtualType({
    ifHaveType: MANAGEMENT.GLOBAL_ROLE,
    labelKey:   'rbac.roletemplate.label',
    name:       ROLES_VIRTUAL_TYPE,
    namespaced: false,
    weight:     100,
    icon:       'user',
    route:      { name: 'c-cluster-auth-roles' }
  });

  virtualType({
    labelKey:   'rbac.roletemplate.label',
    icon:       'user',
    namespaced: false,
    name:       ROLES_VIRTUAL_TYPE,
    weight:     102,
    route:      { name: 'c-cluster-auth-roles' },
    // There are two resource types shown on this page, MANAGEMENT.GLOBAL_ROLE and MANAGEMENT.ROLE_TEMPLATE
    // If there user can't see ROLE_TEMPLATE, they definitely can't see GLOBAL_ROLE
    ifHaveType: MANAGEMENT.ROLE_TEMPLATE
  });

  basicType([
    'config',
    USERS_VIRTUAL_TYPE,
    ROLES_VIRTUAL_TYPE,
  ]);

  const DISPLAY_NAME = {
    ...HEADER_NAME,
    name:     'displayName',
    labelKey: 'tableHeaders.nameDisplay',
  };

  headers(MANAGEMENT.GLOBAL_ROLE, [
    STATE,
    DISPLAY_NAME,
    SIMPLE_NAME,
    RBAC_BUILTIN,
    {
      ...RBAC_DEFAULT,
      labelKey: 'tableHeaders.authRoles.globalDefault',
    },
    AGE
  ]);

  headers(MANAGEMENT.ROLE_TEMPLATE, [
    STATE,
    DISPLAY_NAME,
    SIMPLE_NAME,
    RBAC_BUILTIN,
    RBAC_DEFAULT,
    AGE
  ]);
}
