import { MANAGEMENT } from '@shell/config/types';
import { md5 } from '@shell/utils/crypto';
import Identicon from 'identicon.js';
import { ucFirst } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';

import { set } from '@shell/utils/object';

export default class User extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: 'management.llmos.ai/v1',
      kind:       'User',
      metadata:   {
        generateName: 'user-',
        labels:       {},
        annotations:  {},
      },
      spec: {
        username: '',
        password: '',
        active:   true,
      },
    };

    this['metadata'] = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get loginName() {
    return this.metadata?.labels['management.llmos.ai/username'] || '';
  }

  get isSystem() {
    const p = this.$rootGetters['auth/principalId'];

    return p.startsWith('system://');
  }

  get isCurrentUser() {
    return this.$rootGetters['auth/principalId'] === this.user.id;
  }

  get nameDisplay() {
    return this.spec?.displayName || this.username || this.id;
  }

  get labelForSelect() {
    const name = this.nameDisplay;
    const id = this.id;

    if (name === id) {
      return id;
    } else {
      return `${ name } (${ id })`;
    }
  }

  get provider() {
    return 'local';
  }

  get providerDisplay() {
    return this.$rootGetters['i18n/withFallback'](
      `model.authConfig.provider."${ this.provider }"`,
      null,
      this.provider
    );
  }

  get state() {
    if (this.status?.isActive === false) {
      return 'inactive';
    }

    if (this.status?.isActive === true) {
      return 'active';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get description() {
    return this._description;
  }

  set description(value) {
    this._description = value;
  }

  // Ensure when we clone that we preserve the description
  toJSON() {
    const data = super.toJSON();

    if (data.spec) {
      data.spec.description = this._description;
      delete data._description;
    }

    return data;
  }

  async save(opt) {
    const clone = await this.$dispatch('clone', { resource: this });

    return clone._save(opt);
  }

  async setEnabled(enabled) {
    const clone = await this.$dispatch(
      'management/clone',
      { resource: this.user },
      { root: true }
    );

    clone.spec.active = enabled;
    await clone.save();
  }

  async activate() {
    await this.setEnabled(true);
  }

  async deactivate() {
    await this.setEnabled(false);
  }

  canActivate(state) {
    const stateOk = state ? this.state === 'inactive' : this.state === 'active';
    const permissionOk = this.hasLink('update'); // Not canUpdate, only gate on api not whether editable pages should be visible

    return stateOk && permissionOk && !this.isCurrentUser;
  }

  get _availableActions() {
    return [
      {
        action:     'activate',
        label:      this.t('action.activate'),
        icon:       'icon icon-play',
        bulkable:   true,
        bulkAction: 'activateBulk',
        enabled:    this.canActivate(true),
        weight:     2,
      },
      {
        action:     'deactivate',
        label:      this.t('action.deactivate'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    this.canActivate(false),
        weight:     1,
      },
      { divider: true },
      ...super._availableActions,
    ];
  }

  get details() {
    return [
      {
        label:     this.t('user.detail.username'),
        formatter: 'CopyToClipboard',
        content:   this.spec.username,
      },
      ...this._details,
    ];
  }

  get confirmRemove() {
    return true;
  }

  get user() {
    return this.$rootGetters['management/byId'](MANAGEMENT.USER, this.id);
  }

  get canDelete() {
    return this.user?.hasLink('remove') && !this.isCurrentUser;
  }

  get avatarSrc() {
    let id = this.id || 'Unknown';

    id = id.replace(/[^:]+:\/\//, '');

    const hash = md5(id, 'hex');
    const out = `data:image/png;base64,${ new Identicon(
      hash,
      80,
      0.01
    ).toString() }`;

    return out;
  }

  get roundAvatar() {
    return this.provider === 'github';
  }

  get providerSpecificType() {
    const parts = this.id.replace(/:.*$/, '').split('_', 2);

    if (parts.length === 2) {
      return parts[1];
    }

    return null;
  }

  get displayType() {
    const provider = this.$rootGetters['i18n/withFallback'](
      `model.authConfig.provider."${ this.provider }"`,
      null,
      this.provider
    );

    return `${ provider } ${ ucFirst(this.providerSpecificType) }`;
  }
}
