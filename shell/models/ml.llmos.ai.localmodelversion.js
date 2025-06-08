import SteveModel from '@shell/plugins/steve/steve-class';

import { LLMOS, PVC } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';

export default class LocalModelVersion extends SteveModel {
  get isDefault() {
    return this.localModel?.spec?.defaultVersion === this.metadata.name;
  }

  setDefault() {
    const data = { spec: { defaultVersion: this.metadata.name } };

    return this.localModel.patch(
      data,
      {
        // url:     this.localModel.linkFor('patch'),
        headers: { 'content-type': 'application/merge-patch+json' },
      },
      true,
      true
    );
  }

  get localModel() {
    const localModel = this.spec?.localModel;
    const namespace = this.metadata?.namespace;

    return this.$getters['byId'](LLMOS.LOCAL_MODEL, `${ namespace }/${ localModel }`);
  }

  get _availableActions() {
    const out = super._availableActions;

    if (!this.isDefault) {
      out.unshift({
        action:  'setDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.setAsDefault'),
      });
    }

    return out;
  }

  get volumeClaims() {
    return this.$getters['byId'](PVC, this.id) || {};
  }

  get groupByModel() {
    const name = `${ this.metadata.namespace }/${ this.spec?.localModel }` || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.model', { name: escapeHtml(name) });
  }
}
