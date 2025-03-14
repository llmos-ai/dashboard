import { get, set } from '@shell/utils/object';
import SteveDescriptionModel from '@shell/plugins/steve/steve-description-class';
import { AS, MODE, _CLONE, _UNFLAG } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { SUBTYPE_MAPPING, SPECIAL } from '@shell/models/management.llmos.ai.globalrole';

export default class RoleTemplate extends SteveDescriptionModel {
  applyDefaults() {
    const value = {
      apiVersion: 'management.llmos.ai/v1',
      kind:       'RoleTemplate',
      metadata:   {
        name:        '',
        labels:      {},
        annotations: {},
      },
      spec: {
        builtin:             false,
        newNamespaceDefault: false,
        displayName:         '',
      },
    };

    this['metadata'] = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:   this.t('resourceDetail.detailTop.name'),
      content: get(this, 'name')
    });

    return out;
  }

  get state() {
    return this.spec.locked ? 'locked' : this.metadata?.state?.name || 'unknown';
  }

  get isSpecial() {
    return SPECIAL.includes(this.id) || this.spec?.builtin;
  }

  get subtype() {
    if (this._subtype) {
      return this._subtype;
    }

    if (this.type === SUBTYPE_MAPPING.NAMESPACE.type) {
      return SUBTYPE_MAPPING.NAMESPACE.key;
    }

    return null;
  }

  updateSubtype(subtype) {
    this['_subtype'] = subtype;
    this.context = SUBTYPE_MAPPING[subtype].context;
  }

  get default() {
    return !!this.spec.newNamespaceDefault;
  }

  get builtin() {
    return this.spec?.builtin;
  }

  get listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ this.subtype }`
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

  goToClone(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:      _CLONE,
      [AS]:        _UNFLAG,
      roleContext: this.subtype,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.id);
  }

  get canDelete() {
    return this.roleTemplate?.hasLink('remove') && !this.isSpecial;
  }

  get canUpdate() {
    return this.roleTemplate?.hasLink('update') && !this.isSpecial;
  }
}
