import { insertAt } from '@shell/utils/array';
import { POD, WORKLOAD_TYPES, ML_WORKLOAD_TYPES } from '@shell/config/types';
import { convertSelectorObj, matching, matches } from '@shell/utils/selector';
import MLWorkloadService from '@shell/models/ml_workload.service';
import { formatSi, parseSi, VRAM_PARSE_RULES } from '@shell/utils/units';
import { set } from '@shell/utils/object';
import { ANNOTATIONS, TIMESTAMP } from '@shell/config/labels-annotations';
import { NVIDIA } from '@shell/utils/container-resource';

export default class MlWorkload extends MLWorkloadService {
  // remove clone as yaml/edit as yaml until API supported
  get _availableActions() {
    const type = this._type ? this._type : this.type;
    let out = super._availableActions;

    insertAt(out, 0, {
      action:  'openShell',
      enabled: !!this.links.view,
      icon:    'icon icon-fw icon-chevron-right',
      label:   this.t('action.openShell'),
      total:   1,
    });

    if (type !== ML_WORKLOAD_TYPES.RAY_CLUSTER) {
      insertAt(out, 1, {
        action:  'pause',
        label:   this.t('asyncButton.pause.action'),
        icon:    'icon icon-pause',
        enabled: !!this.links.update && !this.isPaused
      });

      insertAt(out, 1, {
        action:  'resume',
        label:   this.t('asyncButton.resume.action'),
        icon:    'icon icon-play',
        enabled: !!this.links.update && this.isPaused
      });
    }

    insertAt(out, 5, {
      action:   'redeploy',
      label:    this.t('action.redeploy'),
      icon:     'icon icon-refresh',
      enabled:  !!this.links.update,
      bulkable: true,
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

    for (const pod of pods) {
      if (pod.isRunning) {
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

  get details() {
    return [
      {
        label:   this.t('mlWorkload.detail.detailTop.cpu'),
        content: this.cpuLimit
      },
      {
        label:   this.t('mlWorkload.detail.detailTop.memory'),
        content: this.memoryLimit
      },
      {
        label:   this.t('mlWorkload.detail.detailTop.vgpu'),
        content: this.vgpu,
      },
      {
        label:   this.t('mlWorkload.detail.detailTop.vram'),
        content: this.vram,
      }];
  }

  redeploy() {
    const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

    if ( !this.metadata ) {
      set(this, 'metadata', {});
    }

    const annotations = this.metadata.annotations || {};

    annotations[TIMESTAMP] = now;
    set(this.metadata, 'annotations', annotations);

    this.save();

    // Delete all pods which is not running
    const pods = this.pods || [];

    for (const pod of pods) {
      pod.remove();
    }
    this.$dispatch('growl/success', { message: `${ this.kind } ${ this.name } has been successfully redeployed.` }, { root: true });
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

    if (!selector) {
      return [];
    }

    const pods = this.$getters['podsByNamespace'](this.metadata.namespace);

    return pods.filter((obj) => {
      return matches(obj, selector);
    });
  }

  get podGauges() {
    const out = {};

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
    case ML_WORKLOAD_TYPES.MODEL_SERVICE:
      return this.spec?.selector;
    case ML_WORKLOAD_TYPES.NOTEBOOK:
      return this.spec?.selector;
    case ML_WORKLOAD_TYPES.RAY_CLUSTER:
      return {
        matchLabels: {
          'app.kubernetes.io/name': 'kuberay',
          'ray.io/cluster':         this.name
        }
      };
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

    if ( this.isPaused ) {
      return 'paused';
    }

    return super.state;
  }

  get isPaused() {
    return this.metadata.annotations?.[ANNOTATIONS.RESOURCE_STOPPED] || this.spec.replicas === 0;
  }

  pause() {
    if (!this.metadata.annotations) {
      set(this, 'metadata.annotations', {});
    }
    this.metadata.annotations[ANNOTATIONS.RESOURCE_STOPPED] = 'true';
    this.save();
  }

  resume() {
    delete this.metadata.annotations[ANNOTATIONS.RESOURCE_STOPPED];
    this.save();
  }

  async scaleDown() {
    const newScale = this.spec.replicas - 1;

    if (newScale >= 0) {
      set(this.spec, 'replicas', newScale);
      await this.save();
    }
  }

  async scaleUp() {
    set(this.spec, 'replicas', this.spec.replicas + 1);
    await this.save();
  }

  siOptions() {
    return {
      increment: 1024,
      suffix:    'i',
    };
  }

  get containers() {
    let containers = this.spec.template?.spec?.containers || [];

    if (this.type === ML_WORKLOAD_TYPES.RAY_CLUSTER) {
      containers = containers.concat(this.spec.headGroupSpec.template.spec.containers || []);
      this.spec.workerGroupSpecs.forEach((worker) => {
        containers = containers.concat(worker.template.spec.containers || []);
      });
    }

    return containers;
  }

  get cpuLimit() {
    return formatSi(
      this.containers.reduce((total, container) => {
        return total + parseSi(container.resources?.limits?.cpu || 0);
      }, 0)
    );
  }

  get memoryLimit() {
    const totalMemory = this.containers.reduce((total, container) => {
      return total + parseSi(container.resources?.limits?.memory || 0);
    }, 0);

    return formatSi(totalMemory, this.siOptions());
  }

  get vgpu() {
    const totalVGPU = this.containers.reduce((sum, container) => {
      return sum + (container.resources?.limits[NVIDIA.vGPU] || 0);
    }, 0);

    return totalVGPU > 0 ? formatSi(totalVGPU) : 'N/A';
  }

  get vram() {
    const totalVRAM = this.containers.reduce((sum, container) => {
      return sum + (container.resources?.limits[NVIDIA.vGPUMem] || 0);
    }, 0);

    return !totalVRAM ? 'N/A' : formatSi(parseSi(totalVRAM), VRAM_PARSE_RULES.format);
  }
}
