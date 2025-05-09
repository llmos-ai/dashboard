import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { matchModelString } from '@shell/utils/ai-model';
import { _EDIT, ENABLED, MODE } from '@shell/config/query-params';
import { LLMOS } from '@shell/config/types';

export default class Dataset extends SteveModel {
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
      componentProps: {
        datasetId: this.id,
      },
    });
  }
 
  get datasetVersions() {
    return (this.$getters['all'](LLMOS.DATASET_VERSION) || []).filter(d => (d?.status?.rootPath || '').includes(`datasets/${this.id}`));
  }
}
