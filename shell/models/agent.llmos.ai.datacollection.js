import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { LLMOS } from '@shell/config/types';

export default class Dataset extends SteveModel {
  applyDefaults() {
    const value = {
      metadata: {
        name:        '',
        namespace:   '',
        labels:      {},
        annotations: {},
      },
      spec: { registry: this.hasDefaultRegistry ? this.t('modelRegistry.useDefault') : '' },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get documentCount() {
    return (this.status?.files || []).length;
  }

  get hasDefaultRegistry() {
    const registries = this.$getters['all'](LLMOS.REGISTRY);
    const out = (registries || []).find((registry) => registry.isDefault);

    return out?.id;
  }
}
