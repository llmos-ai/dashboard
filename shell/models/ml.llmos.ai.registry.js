import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { REGISTRY } from '@shell/config/labels-annotations';
import { LLMOS } from '@shell/config/types';

export default class ModelRegistry extends SteveModel {
  applyDefaults() {
    const value = {
      metadata: {
        name:        '',
        namespace:   '',
        labels:      {},
        annotations: {},
      },
      spec: {
        backendType: 'S3',
        s3Config:    {
          endpoint:                   '',
          bucket:                     '',
          accessCredentialSecretName: '',
          useSSL:                     false,
        },
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get isAccessible() {
    if (this.accessibleCondition.status === 'True') {
      return true;
    } else {
      return false;
    }
  }

  get accessibleCondition() {
    return this.status?.conditions?.find((condition) => condition.type === 'accessible') || {};
  }

  get stateObj() {
    return this.isAccessible ? this.metadata?.state : {
      ...this.metadata?.state,
      name:    'Inactive',
      error:   true,
      message: this.accessibleCondition?.message,
    };
  }

  get isDefault() {
    return this.annotations[REGISTRY.DEFAULT_REGISTRY] === 'true';
  }

  updateDefault(value) {
    this.setAnnotation(REGISTRY.DEFAULT_REGISTRY, value.toString());

    const data = { metadata: { annotations: { [REGISTRY.DEFAULT_REGISTRY]: value.toString() } } };

    return this.patch(data, {
      headers: {
        'content-type': 'application/merge-patch+json',
      },
    }, true, true);
  }

  resetDefault() {
    if (this.isDefault) {
      this.updateDefault(false);
    }
  }

  setDefault() {
    const registries = this.$rootGetters['cluster/all'](LLMOS.REGISTRY) || [];

    registries.forEach((storageClass) => storageClass.resetDefault());
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
}
