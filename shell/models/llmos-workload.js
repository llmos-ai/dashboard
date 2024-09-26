import { insertAt } from '@shell/utils/array';
import { POD, LLMOS, WORKLOAD_TYPES } from '@shell/config/types';
import { convertSelectorObj, matching, matches } from '@shell/utils/selector';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class LLMOSWorkload extends SteveModel {
  // remove clone as yaml/edit as yaml until API supported
  get _availableActions() {
    let out = super._availableActions;

    insertAt(out, 0, {
      action:  'openShell',
      enabled: !!this.links.view,
      icon:    'icon icon-fw icon-chevron-right',
      label:   this.t('action.openShell'),
      total:   1,
    });

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return out;
  }

  async openShell() {
    const pods = await this.matchingPods();

    for ( const pod of pods ) {
      if ( pod.isRunning ) {
        pod.openShell();

        return;
      }
    }

    this.$dispatch('growl/error', {
      title:   'Unavailable',
      message: 'There are no running pods to execute a shell in.'
    }, { root: true });
  }

  get available() {
    return this.status?.readyReplicas || 0;
  }

  get warnDeletionMessage() {
    if (this.isFromNorman) {
      return this.t('workload.normanWarning');
    } else {
      return null;
    }
  }

  get pods() {
    const selector = this.podSelector;

    if (selector) {
      const pods = this.$getters['podsByNamespace'](this.metadata.namespace);

      return pods.filter((obj) => {
        return matches(obj, selector);
      });
    } else {
      return [];
    }
  }

  get podGauges() {
    const out = { };

    if (!this.pods) {
      return out;
    }

    this.pods.map((pod) => {
      const { stateColor, stateDisplay } = pod;

      if (out[stateDisplay]) {
        out[stateDisplay].count++;
      } else {
        out[stateDisplay] = {
          color: stateColor.replace('text-', ''),
          count: 1
        };
      }
    });

    return out;
  }

  async matchingPods() {
    const all = await this.$dispatch('findAll', { type: POD });
    const allInNamespace = all.filter((pod) => pod.metadata.namespace === this.metadata.namespace);

    const selector = convertSelectorObj(this.podSelector);

    return matching(allInNamespace, selector);
  }

  get podSelector() {
    const type = this._type ? this._type : this.type;

    switch (type) {
    case LLMOS.MODEL_SERVICE:
      return this.spec?.selector;
    case LLMOS.NOTEBOOK:
      return this.spec?.selector;
    default:
      return this.metadata?.labels;
    }
  }

  get ready() {
    const readyReplicas = Math.max(0, (this.status?.replicas || 0) - (this.status?.unavailableReplicas || 0));

    if (this.type === WORKLOAD_TYPES.DAEMON_SET) {
      return readyReplicas;
    }

    return `${ readyReplicas }/${ this.desired }`;
  }

  get unavailable() {
    return this.status?.unavailableReplicas || 0;
  }

  get stateStatus() {
    return this.status?.state || super.state;
  }

  get state() {
    if (!this.status || !this.status?.state) {
      return 'in-progress';
    }

    return super.state;
  }

  remove() {
    const opt = { ...arguments };

    opt.params = { propagationPolicy: 'Foreground' };

    return this._remove(opt);
  }
}
