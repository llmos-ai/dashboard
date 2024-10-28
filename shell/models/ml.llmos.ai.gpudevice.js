import SteveModel from '@shell/plugins/steve/steve-class';
import { parseSi, roundToDecimal } from '@shell/utils/units';

export default class GPUDevice extends SteveModel {
  get vGPUCount() {
    if (!this.status) {
      return 'N/A';
    }
    const requestedCount = this.status.pods.length;

    return `${ requestedCount }/${ this.status.count }`;
  }

  get vramUsageValue() {
    let count = 0;

    for (const pod of this.status.pods) {
      count += pod.memReq;
    }

    return count;
  }

  get vramUsage() {
    return parseSi(`${ this.vramUsageValue }Mi`);
  }

  get vramCapacity() {
    return parseSi(`${ this.status?.vRAM }MiB`);
  }

  get vramUsagePercentage() {
    return ((this.vramUsage * 100) / this.vramCapacity).toString();
  }

  get vramAllocated() {
    const amountTemplateValues = {
      used:  roundToDecimal((this.vramUsageValue / 1024) || 0, 1),
      total: roundToDecimal((this.status.vRAM / 1024) || 0, 1),
      unit:  'GiB'
    };

    return this.t('node.detail.glance.consumptionGauge.uAmount', amountTemplateValues);
  }
}
