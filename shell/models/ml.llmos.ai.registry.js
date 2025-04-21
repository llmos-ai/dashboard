import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';

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
    return this.isAccessible ? this.metadata.state : {
      ...this.metadata.state,
      name:    'Inactive',
      error:   true,
      message: this.accessibleCondition.message,
    };
  }
}
