import HybridModel, { cleanHybridResources } from '@shell/plugins/steve/hybrid-class';
import {MANAGEMENT} from "@shell/config/types";

export default class User extends HybridModel {
  // Preserve description
  constructor(data, ctx, rehydrateNamespace = null, setClone = false) {
    console.log('User constructor', data);
    const _description = data.spec?.description;

    super(data, ctx, rehydrateNamespace, setClone);
    this.description = _description;
  }

  get isSystem() {
    const p = this.$rootGetters['auth/principalId'];
    return p.startsWith('system://');
  }

  get isCurrentUser() {
    return this.$rootGetters['auth/principalId'] === this.user.id;
  }

  get nameDisplay() {
    return this.displayName || this.username || this.id;
  }

  get labelForSelect() {
    const name = this.nameDisplay;
    const id = this.id;

    if ( name === id ) {
      return id;
    } else {
      return `${ name } (${ id })`;
    }
  }

  get provider() {
    return 'local';
  }

  get providerDisplay() {
    return this.$rootGetters['i18n/withFallback'](`model.authConfig.provider."${ this.provider }"`, null, this.provider);
  }

  get state() {
    if ( this.spec?.isActive === false ) {
      return 'inactive';
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

    data.spec.description = this._description;
    delete data._description;

    return data;
  }

  async save(opt) {
    const clone = await this.$dispatch('clone', { resource: this });

    return clone._save(opt);
  }

  async setEnabled(enabled) {
    const clone = await this.$dispatch('management/clone', { resource: this.user }, { root: true });

    clone.spec.isActive = enabled;
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
        weight:     2
      },
      {
        action:     'deactivate',
        label:      this.t('action.deactivate'),
        icon:       'icon icon-pause',
        bulkable:   true,
        bulkAction: 'deactivateBulk',
        enabled:    this.canActivate(false),
        weight:     1
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
        content:   this.spec.username
      },
      ...this._details
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

  get canUpdate() {
    return this.user?.hasLink('update');
  }

  remove() {
    return this.user?.remove();
  }
}
