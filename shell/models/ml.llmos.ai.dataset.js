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
        registry:    this.t('modelRegistry.useDefault'),
      },
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get availableActions() {
    const out = super._availableActions;

    const newVersion = {
      action:  'newVersion',
      enabled: true,
      icon:    'icon icon-copy',
      label:   this.t('datasetCard.actions.newVersion'),
    };

    out.unshift(newVersion);

    return out;
  }

  async newVersion() {
    this.$dispatch('promptModal', {
      component:      'CreateDatasetVersionModal',
      modalWidth:     '600px',
      componentProps: { datasetId: this.id },
    });
  }

  get datasetVersions() {
    return (this.$getters['all'](LLMOS.DATASET_VERSION) || [])
      .filter((d) => (d?.status?.rootPath || '').includes(`datasets/${ this.id }`))
      .sort((a, b) => {
        const matchA = (a.metadata.name || '').match(/^v(\d+)/);
        const matchB = (b.metadata.name || '').match(/^v(\d+)/);

        const versionA = matchA ? parseInt(matchA[1]) : 0;
        const versionB = matchB ? parseInt(matchB[1]) : 0;

        return versionB - versionA;
      });
  }

  get latestDatasetVersion() {
    return this.datasetVersions?.[0] || {};
  }
}
