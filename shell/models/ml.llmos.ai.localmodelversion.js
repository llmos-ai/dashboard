import SteveModel from '@shell/plugins/steve/steve-class';

import { REGISTRY } from '@shell/config/labels-annotations';
import { LLMOS } from '@shell/config/types';

import { set } from '@shell/utils/object';
import { escapeHtml } from '@shell/utils/string';

export default class LocalModelVersion extends SteveModel {
  get isDefault() {
    return this.localModel?.spec?.defaultVersion === this.id;
  }

  setDefault() {
    const data = { 
      spec: {
        defaultVersion: this.id,
      } 
    };

    return this.localModel.patch(data, {
      headers: {
        'content-type': 'application/merge-patch+json',
      },
    }, true, true);
  }

  get localModel() {
    const localModel = this.spec?.localModel;
    const namespace = this.metadata?.namespace;

    return this.$getters['byId'](LLMOS.LOCAL_MODEL, `${ namespace }/${ localModel }`)
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

  get groupByModel() {
    const name = `${this.metadata.namespace}/${this.spec?.localModel}` || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.model', { name: escapeHtml(name) });
  }
}
