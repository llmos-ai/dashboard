import SteveModel from '@shell/plugins/steve/steve-class';
import { parseSi, roundToDecimal } from '@shell/utils/units';

export default class GPUDevice extends SteveModel {
  get vGPUCount() {
    if (!this.status) {
      return 0;
    }
    const requestedCount = this.status.pods?.length || 0;

    return `${ requestedCount }/${ this.status.maxCount }`;
  }

  get vramUsageValue() {
    let count = 0;

    if (!this.status?.pods) {
      return 0;
    }

    for (const pod of this.status?.pods) {
      count += pod.memReq;
    }

    return count;
  }

  get vram() {
    return parseSi(`${ this.status?.vram }Gi`);
  }

  get vramUsage() {
    return parseSi(`${ this.vramUsageValue }Mi`);
  }

  get vramCapacity() {
    return parseSi(`${ this.status?.vram }Mi`);
  }

  get vramAllocated() {
    const amountTemplateValues = {
      used:  roundToDecimal((this.vramUsageValue / 1024) || 0, 2),
      total: roundToDecimal((this.status.vram / 1024) || 0, 1),
      unit:  'GiB'
    };

    return this.t('gpuDevice.detail.consumptionGauge.uAmount', amountTemplateValues);
  }

  get deviceStatus() {
    if (!this.status) {
      return 'N/A';
    }

    return this.status.state ? 'Health' : 'UnHealth';
  }

  get stateDisplay() {
    return this?.status?.state;
  }

  get stateColor() {
    const stateDisplay = this.stateDisplay;

    if (!stateDisplay) {
      return 'text-darker';
    }

    const state = stateDisplay.toLowerCase();

    if (state === 'healthy') {
      return 'text-success';
    } else if (state === 'offline') {
      return 'text-darker';
    } else if (state === 'pending') {
      return 'text-warning';
    } else if (state === 'unhealthy' || state === 'error') {
      return 'text-error';
    } else {
      return 'text-info';
    }
  }
}
