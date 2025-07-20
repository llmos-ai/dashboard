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
        datasetCard: { metadata: { splitTypes: [] } },
        registry:    this.hasDefaultRegistry ? this.t('modelRegistry.useDefault') : '',
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get availableActions() {
    let out = super._availableActions;

    const newVersion = {
      action:  'newVersion',
      enabled: true,
      icon:    'icon icon-copy',
      label:   this.t('datasetCard.actions.newVersion'),
    };

    const deleteVersion = {
      action:  'deleteVersion',
      enabled: true,
      icon:    'icon icon-trash',
      label:   this.t('datasetCard.actions.deleteVersion'),
    };

    out = [
      newVersion,
      deleteVersion,
      ...out
    ];

    return out;
  }

  async newVersion() {
    this.$dispatch('promptModal', {
      component:      'CreateDatasetVersionModal',
      modalWidth:     '600px',
      componentProps: { datasetId: this.id },
    });
  }

  async deleteVersion() {
    this.$dispatch('promptModal', {
      component:      'DeleteDatasetVersionModal',
      modalWidth:     '600px',
      componentProps: { datasetId: this.id },
    });
  }

  get datasetVersions() {
    const out = (this.$getters['all'](LLMOS.DATASET_VERSION) || [])
      .filter((d) => {
        const rootPath = d?.status?.rootPath || '';
        const expectedPath = `datasets/${ this.id }`;

        // 精确匹配：路径应该以 expectedPath 开头，并且后面要么是结尾，要么是 '/'
        return rootPath === expectedPath || rootPath.startsWith(`${ expectedPath }/`);
      })
      .sort((a, b) => {
        const matchA = (a.metadata.name || '').match(/^v(\d+)/);
        const matchB = (b.metadata.name || '').match(/^v(\d+)/);

        const versionA = matchA ? parseInt(matchA[1]) : 0;
        const versionB = matchB ? parseInt(matchB[1]) : 0;

        return versionB - versionA;
      });

    return out;
  }

  get latestDatasetVersion() {
    return this.datasetVersions?.[0] || {};
  }

  get hasDefaultRegistry() {
    const registries = this.$getters['all'](LLMOS.REGISTRY);
    const out = (registries || []).find((registry) => registry.isDefault);

    return out?.id;
  }
}
