import SteveModel from '@shell/plugins/steve/steve-class';

import { REGISTRY } from '@shell/config/labels-annotations';
import { LLMOS } from '@shell/config/types';

import { set } from '@shell/utils/object';
import { escapeHtml } from '@shell/utils/string';

export default class LocalModelVersion extends SteveModel {
  get isDefault() {
    return this.annotations[REGISTRY.DEFAULT_LOCAL_MODEL_VERSION] === 'true';
  }

  updateDefault(value) {
    this.setAnnotation(REGISTRY.DEFAULT_LOCAL_MODEL_VERSION, value.toString());

    const data = { metadata: { annotations: { [REGISTRY.DEFAULT_LOCAL_MODEL_VERSION]: value.toString() } } };

    return this.patch(data, {}, true, true);
  }

  resetDefault() {
    if (this.isDefault) {
      this.updateDefault(false);
    }
  }

  setDefault() {
    const versions = this.$rootGetters['cluster/all'](LLMOS.LOCAL_MODEL_VERSION) || [];

    versions.filter(v => v.spec.localModel = this.spec.localModel).map((version) => version.resetDefault());
    this.updateDefault(true);
  }

  get _availableActions() {
    const out = super._availableActions;

    if (this.isDefault) {
      out.unshift({
        action:  'resetDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.resetDefault'),
      });
    } else {
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
    const name = this.spec?.localModel || this.$rootGetters['i18n/t']('generic.none');

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.model', { name: escapeHtml(name) });
  }
}
