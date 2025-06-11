import { _EDIT, MODE, STEP } from '@shell/config/query-params';
import SteveModel from '@shell/plugins/steve/steve-class';
import { APP } from '@shell/config/types';
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
        files:          [],
        chunkingConfig: {},
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get documentCount() {
    return (this.spec?.files || []).length;
  }

  get _availableActions() {
    const out = super._availableActions;

    const IMPORT_DATA = {
      action:  'importData',
      enabled: true,
      icon:    'icon icon-fw icon-copy',
      label:   this.t('knowledgeBase.actions.importData'),
    };

    const HIT_TEST = {
      action:  'hitTest',
      enabled: true,
      icon:    'icon icon-fw icon-checkmark',
      label:   this.t('knowledgeBase.actions.hitTest'),
    };

    return [IMPORT_DATA, HIT_TEST, ...out];
  }

  hitTest() {
    this.currentRouter().push({
      name:   'c-cluster-product-resource-namespace-id-hit',
      params: {
        cluster:   'local',
        resource:  APP.KNOWLEDGE_BASE,
        namespace: this.metadata.namespace,
        id:        this.metadata.name,
      },
    });
  }

  importData() {
    this.currentRouter().push({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster:   'local',
        resource:  APP.KNOWLEDGE_BASE,
        namespace: this.metadata.namespace,
        id:        this.metadata.name,
      },
      query: {
        [MODE]: _EDIT,
        [STEP]: '1',
      },
    });
  }
}
