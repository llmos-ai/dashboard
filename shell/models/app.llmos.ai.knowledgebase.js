import SteveModel from '@shell/plugins/steve/steve-class';
import { LLMOS } from '@shell/config/types';
import { set } from '@shell/utils/object';

export default class Dataset extends SteveModel {
  applyDefaults() {
    const value = {
      metadata: {
        name:        '',
        namespace:   '',
        labels:      {},
        annotations: {},
      },
      spec: {
        embeddingModel: '',
        files: [],
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get documentCount() {
    return (this.spec?.files || []).length;
  }
}
