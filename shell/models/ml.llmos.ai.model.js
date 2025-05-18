import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { matchModelString } from '@shell/utils/ai-model';
import { _EDIT, ENABLED, MODE } from '@shell/config/query-params';
import { NAME as LLMOS } from '@shell/config/product/llmos';

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
        modelCard: { metadata: {} },
        registry: this.t('modelRegistry.useDefault'), 
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get icon() {
    const icon = matchModelString(this.metadata.name);
    const baseIcon = matchModelString(this.spec.modelCard.metadata.baseModel);

    return icon || baseIcon || '';
  }

  get iconUrl() {
    try {
      return require(`~shell/assets/images/model-providers/${ this.icon }-color.svg`);
    } catch (err) {
      try {
        return require(`~shell/assets/images/model-providers/${ this.icon }.svg`);
      } catch (err) {
        return require(`~shell/assets/images/model-providers/ai-folder.svg`);
      }
    }
  }

  get editUrl() {
    const query = {
      [MODE]:    _EDIT,
      [ENABLED]: 'true',
    };

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        product:   LLMOS,
        cluster:   this.currentRoute()?.params?.cluster || 'local',
        resource:  this.type,
        namespace: this.namespace,
        id:        this.metadata.name,
      },
      query,
    };
  }

  get displayTags() {
    return (this.spec.modelCard.metadata.tags || [])
      .filter((tag) => {
        if (tag.endsWith('k') || tag.endsWith('K')) {
          return true;
        }
      });
  }
}
