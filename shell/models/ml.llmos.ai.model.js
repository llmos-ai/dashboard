import { message } from 'ant-design-vue';

import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { matchModelString } from '@shell/utils/ai-model';
import { _EDIT, ENABLED, MODE } from '@shell/config/query-params';
import { NAME as LLMOS } from '@shell/config/product/llmos';
import { LLMOS as LLMOS_TYPES } from '@shell/config/types';

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
        registry:  this.t('modelRegistry.useDefault'),
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

  get availableActions() {
    const out = super._availableActions;

    const cache = {
      action:  'cache',
      enabled: true,
      icon:    'icon icon-copy',
      label:   this.t('modelCard.actions.cache.label'),
    };

    out.unshift(cache);

    return out;
  }

  get localModel() {
    const localModel = this.$getters[`byId`](LLMOS_TYPES.LOCAL_MODEL, `${this.id}`);

    return localModel || {};
  }

  async createLocalModel() {
    const name = this.metadata?.name

    if (!this.localModel.id) {
      const resource = await this.$dispatch(`create`, {
        type:     LLMOS_TYPES.LOCAL_MODEL,
        metadata: {
          name,
          namespace: this.metadata?.namespace,
        },
        spec: {
          registry:  this.spec?.registry,
          modelName: `${ this.id }`
        },
      });

      return await resource.save();
    } else {
      return this.localModel;
    }
  }

  async cache() {
    try {
      const newLocalModel = await this.createLocalModel();
      const localModelName = newLocalModel?.metadata?.name

      const localModelVersion = await this.$dispatch(`create`, {
        type:     LLMOS_TYPES.LOCAL_MODEL_VERSION,
        metadata: {
          name:      `${localModelName}-v1`,
          namespace: this.metadata?.namespace,
        },
        spec: { localModel: localModelName },
      });

      await localModelVersion.save();

      message.success(this.t('modelCard.actions.cache.success'));
    } catch (err) {
      message.error(`${ err.message || err }`);
    }
  }
}
