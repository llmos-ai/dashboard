import { insertAt } from '@shell/utils/array';
import {
  AS,
  _CLONE,
  FOCUS,
  MODE,
  _UNFLAG,
  _EDIT,
} from '@shell/config/query-params';

import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { LLMOS, STORAGE_CLASS } from '@shell/config/types';
import { clone } from '@shell/utils/object';

export default class PVC extends SteveModel {
  applyDefaults(_, realMode) {
    const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
    const storage =
      realMode === _CLONE ? this.spec.resources.requests.storage : null;

    this['spec'] = {
      accessModes,
      storageClassName: '',
      volumeName: '',
      resources: { requests: { storage } },
    };
  }

  get bound() {
    return this.state === STATES_ENUM.BOUND;
  }

  get expandable() {
    return !!this.$getters[`byId`](STORAGE_CLASS, this.spec?.storageClassName)
      ?.allowVolumeExpansion;
  }

  get _availableActions() {
    const out = super._availableActions;

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, {
      action: 'goToEditVolumeSize',
      enabled: this.expandable && this.bound,
      icon: 'icon icon-fw icon-plus',
      label: this.t('persistentVolumeClaim.expand.label'),
    });

    return out;
  }

  goToEditVolumeSize() {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]: _UNFLAG,
      [FOCUS]: 'volumeclaim',
    };

    this.currentRouter().push(location);
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = LLMOS.VOLUME;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = LLMOS.VOLUME;
    detailLocation.name = `c-cluster-product-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${LLMOS.VOLUME}"`, {
      count: 1,
    }).trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get phaseState() {
    return this.status?.phase || 'N/A';
  }
}
