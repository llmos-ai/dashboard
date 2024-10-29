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

  get vRAMTotal() {
    return `${ roundToDecimal((this.status.vram / 1024) || 0, 1) }Gi`;
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

  get vramUsage() {
    return parseSi(`${ this.vramUsageValue }Mi`);
  }

  get vramCapacity() {
    return parseSi(`${ this.status?.vram }Mi`);
  }

  get vramUsagePercentage() {
    return ((this.vramUsage * 100) / this.vramCapacity).toString();
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

    return this.status.health ? 'Health' : 'UnHealth';
  }
}
