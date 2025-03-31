import SteveModel from '@shell/plugins/steve/steve-class';
import { insertAt } from '@shell/utils/array';
import { POD } from '@shell/config/types';

import { set } from '@shell/utils/object';

export default class CephCluster extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: 'ceph.rook.io/v1',
      kind:       'CephCluster',
      metadata:   {
        name:        '',
        labels:      {},
        annotations: {},
      },
      spec: {
        cephVersion:     { image: 'quay.io/ceph/ceph:v18.2.4' },
        dataDirHostPath: '/var/lib/rook',
        mon:             {
          count:                3,
          allowMultiplePerNode: false,
        },
        mgr:          { count: 1 },
        logCollector: {
          enabled:     true,
          maxLogSize:  '500M',
          periodicity: '12h',
        },
        storage: {
          useAllNodes:   true,
          useAllDevices: true,
          failureDomain: 'host',
        },
      },
    };

    this['metadata'] = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get _availableActions() {
    let out = super._availableActions;

    insertAt(out, 0, {
      action:  'openToolbox',
      enabled: !!this.links.view,
      icon:    'icon icon-fw icon-chevron-right',
      label:   this.t('action.openToolbox'),
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

  async openToolbox() {
    const pods = await this.matchingToolbox();

    for (const pod of pods) {
      if (pod.isRunning) {
        pod.openShell();

        return;
      }
    }

    this.$dispatch(
      'growl/error',
      {
        title:   'Unavailable',
        message: 'There are no running pods to execute a shell in.',
      },
      { root: true }
    );
  }

  async matchingToolbox() {
    const all = await this.$dispatch('findAll', { type: POD });

    return all.filter((pod) => {
      if (
        pod.metadata.namespace === this.metadata.namespace &&
        pod.labels['app'] === 'rook-ceph-tools'
      ) {
        return pod;
      }
    });
  }

  get isLLMOSRelease() {
    return (
      this.annotations?.['meta.helm.sh/release-name'] === 'llmos-ceph-cluster'
    );
  }

  get canDelete() {
    // not include llmos-ceph-cluster
    return !this.isLLMOSRelease && super.canDelete;
  }

  get canUpdate() {
    return !this.isLLMOSRelease && super.canUpdate;
  }

  get canClone() {
    return !this.isLLMOSRelease && super.canClone;
  }
}
