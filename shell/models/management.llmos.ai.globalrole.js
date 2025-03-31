import { DESCRIPTION } from '@shell/config/labels-annotations';
import { get, set } from '@shell/utils/object';
import SteveDescriptionModel from '@shell/plugins/steve/steve-description-class';
import { AS, MODE, _CLONE, _UNFLAG } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';

const USER = 'user';
const ADMIN = 'admin';

export const SPECIAL = [ADMIN, USER];

export const LLMOS_MGMT_API_GROUP = 'management.llmos.ai';
export const SUBTYPE_MAPPING = {
  GLOBAL: {
    key:        'GLOBAL',
    type:       'management.llmos.ai.globalrole',
    defaultKey: 'newUserDefault',
    id:         'GLOBAL',
    labelKey:   'rbac.roletemplate.subtypes.GLOBAL.label',
  },
  NAMESPACE: {
    key:        'NAMESPACE',
    type:       'management.llmos.ai.roletemplate',
    defaultKey: 'newNamespaceDefault',
    id:         'NAMESPACE',
    labelKey:   'rbac.roletemplate.subtypes.NAMESPACE.label',
  },
  RBAC_ROLE: {
    key:      'RBAC_ROLE',
    type:     'rbac.authorization.k8s.io.role',
    id:       'RBAC_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_ROLE.label',
  },
  RBAC_CLUSTER_ROLE: {
    key:      'RBAC_CLUSTER_ROLE',
    type:     'rbac.authorization.k8s.io.clusterrole',
    id:       'RBAC_CLUSTER_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_CLUSTER_ROLE.label',
  },
};

export const VERBS = [
  'create',
  'delete',
  'get',
  'list',
  'patch',
  'update',
  'watch',
];

export const CREATE_VERBS = new Set(['PUT', 'blocked-PUT']);

export default class GlobalRole extends SteveDescriptionModel {
  applyDefaults() {
    const value = {
      apiVersion: 'management.llmos.ai/v1',
      kind:       'GlobalRole',
      metadata:   {
        name:        '',
        labels:      {},
        annotations: {},
      },
      spec: {
        newUserDefault: false,
        builtin:        false,
        displayName:    '',
      },
    };

    this['metadata'] = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:   this.t('resourceDetail.detailTop.name'),
      content: get(this, 'name'),
    });

    return out;
  }

  get nameDisplay() {
    const path = `rbac.globalRoles.role.${ this.id }.label`;
    const label = this.spec?.displayName || this.metadata?.name || this.id;

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get descriptionDisplay() {
    return (
      this.description ||
      this.metadata?.annotations?.[DESCRIPTION] ||
      this.$rootGetters['i18n/withFallback'](
        `rbac.globalRoles.role.${ this.id }.description`,
        this.t(`rbac.globalRoles.unknownRole.description`)
      )
    );
  }

  get isSpecial() {
    return SPECIAL.includes(this.id);
  }

  get subtype() {
    return SUBTYPE_MAPPING.GLOBAL.key;
  }

  get default() {
    return !!this.spec?.newUserDefault;
  }

  get builtin() {
    return this.spec?.builtin;
  }

  get listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ SUBTYPE_MAPPING.GLOBAL.Key }`,
    };
  }

  get detailLocation() {
    return {
      ...this._detailLocation,
      name: `c-cluster-auth-roles-resource-id`,
    };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  updateSubtype(subtype) {
    this['_subtype'] = subtype;
    this.context = SUBTYPE_MAPPING[subtype].context;
  }

  goToClone(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:      _CLONE,
      [AS]:        _UNFLAG,
      roleContext: SUBTYPE_MAPPING.GLOBAL.Key,
      ...moreQuery,
    };

    this.currentRouter().push(location);
  }

  get globalRole() {
    return this.$rootGetters['management/byId'](
      MANAGEMENT.GLOBAL_ROLE,
      this.id
    );
  }

  get canDelete() {
    return this.globalRole?.hasLink('remove') && !this.isSpecial;
  }

  get canUpdate() {
    return this.globalRole?.hasLink('update') && !this.isSpecial;
  }
}
