import SteveModel from '@shell/plugins/steve/steve-class';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import Vue from 'vue';
import { set } from '@shell/utils/object';

export const systemAddonLabel = 'llmos.ai/system-addon';
export const addonAllowEditLabel = 'llmos.ai/system-addon-allow-edit';

export default class ManagedAddon extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: 'management.llmos.ai/v1',
      kind:       'ManagedAddon',
      metadata:   {
        name:        '',
        namespace:   'llmos-system',
        labels:      {},
        annotations: {},
      },
      spec: {
        enabled:       true,
        chart:         '',
        repo:          '',
        version:       '',
        valuesContent: '',
      }
    };

    Vue.set(this, 'metadata', value.metadata);
    set(this, 'spec', this.spec || value.spec);
  }

  get availableActions() {
    const out = super._availableActions;

    const toggleAddon = {
      action:  'toggleAddon',
      enabled: this.allowDisable,
      icon:    this.spec.enabled ? 'icon icon-pause' : 'icon icon-play',
      label:   this.spec.enabled ? this.t('generic.disable') : this.t('generic.enable'),
    };

    out.unshift(toggleAddon);

    return out;
  }

  async toggleAddon() {
    const enableHistory = this.spec.enabled;

    try {
      this.spec.enabled = !this.spec.enabled;
      this.goToEdit();
    } catch (err) {
      this.spec.enabled = enableHistory;
      this.$dispatch('growl/fromError', {
        title: this.t('managedAddon.switchFailed', { action: enableHistory ? this.t('generic.disable') : this.t('generic.enable'), name: (this.metadata.name) }),
        err,
      }, { root: true });
    }
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION];
  }

  get stateColor() {
    const state = this.stateDisplay;

    if (state === 'Ready' && this.stateReady) {
      return 'text-success';
    } else if (state === 'Disabled') {
      return 'text-darker';
    } else if (state === 'InProgress') {
      return 'text-info';
    } else if (state?.toLowerCase().includes('failed') || state?.toLowerCase().includes('error')) {
      return 'text-error';
    } else {
      return 'text-info';
    }
  }

  get stateDisplay() {
    const out = this?.status?.state;

    if (!out) {
      return 'Disabled';
    }

    if (this.stateReady) {
      return 'Ready';
    }

    return out;
  }

  get stateReady() {
    const readyCondition = (this.status?.conditions || []).find((C) => C.type === 'Ready');

    return readyCondition?.status === 'True';
  }

  get canDelete() {
    return this.metadata?.labels?.[systemAddonLabel] !== 'true' && super.canDelete;
  }

  get allowDisable() {
    return (this.labels[systemAddonLabel] !== 'true' || this.labels[addonAllowEditLabel] === 'true') && super.canUpdate;
  }
}
