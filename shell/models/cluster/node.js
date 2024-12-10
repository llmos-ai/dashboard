import { formatPercent } from '@shell/utils/string';
import { NODE_ROLES, RKE, SYSTEM_LABELS } from '@shell/config/labels-annotations.js';
import { LLMOS, METRIC, POD } from '@shell/config/types';
import { parseSi, VRAM_PARSE_RULES } from '@shell/utils/units';
import findLast from 'lodash/findLast';

import SteveModel from '@shell/plugins/steve/steve-class';
import { LOCAL } from '@shell/config/query-params';
import { NVIDIA } from '@shell/utils/container-resource';

export default class ClusterNode extends SteveModel {
  get _availableActions() {
    const actions = this.actions || {};

    const cordon = {
      action:   'cordon',
      enabled:  !!actions.cordon,
      icon:     'icon icon-fw icon-pause',
      label:    'Cordon',
      total:    1,
      bulkable: true
    };

    const uncordon = {
      action:   'uncordon',
      enabled:  !!actions.uncordon,
      icon:     'icon icon-fw icon-play',
      label:    'Uncordon',
      total:    1,
      bulkable: true
    };

    const drain = {
      action:     'drain',
      enabled:    !!actions.drain,
      icon:       'icon icon-fw icon-dot-open',
      label:      this.t('drainNode.action'),
      bulkable:   true,
      bulkAction: 'drain'
    };

    const stopDrain = {
      action:   'stopDrain',
      enabled:  !!actions.stopDrain,
      icon:     'icon icon-fw icon-x',
      label:    this.t('drainNode.actionStop'),
      bulkable: true,
    };

    const openSsh = {
      action:  'openSsh',
      enabled: !!this.provisionedMachine?.links?.shell,
      icon:    'icon icon-fw icon-chevron-right',
      label:   'SSH Shell',
    };

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this.provisionedMachine?.links?.sshkeys,
      icon:    'icon icon-fw icon-download',
      label:   this.t('node.actions.downloadSSHKey'),
    };

    return [
      openSsh,
      downloadKeys,
      { divider: true },
      cordon,
      uncordon,
      drain,
      stopDrain,
      { divider: true },
      ...super._availableActions,
    ];
  }

  openSsh() {
    // Pass in the name of the node, so we display that rather than the name of the provisioned machine
    this.provisionedMachine.openSsh(this.nameDisplay);
  }

  downloadKeys() {
    this.provisionedMachine.downloadKeys();
  }

  get showDetailStateBadge() {
    return true;
  }

  get name() {
    return this.metadata?.name;
  }

  get addresses() {
    return this.status?.addresses || [];
  }

  get internalIp() {
    return findLast(this.addresses, (address) => address.type === 'InternalIP')?.address;
  }

  get externalIp() {
    const annotationAddress = this.metadata.annotations[RKE.EXTERNAL_IP];
    const statusAddress = findLast(this.addresses, (address) => address.type === 'ExternalIP')?.address;

    return statusAddress || annotationAddress;
  }

  get cudaVersion() {
    return this.metadata?.labels?.['nvidia.com/cuda.runtime-version.full'] || '';
  }

  get labels() {
    return this.metadata?.labels || {};
  }

  get customLabelCount() {
    return this.customLabels.length;
  }

  get filteredSystemLabels() {
    return Object.entries(this.labels).reduce((res, [key, value]) => {
      const [prefix] = key.split('/');

      if ( !SYSTEM_LABELS.includes(prefix) ) {
        res[key] = value;
      }

      return res;
    }, {});
  }

  get customLabels() {
    const parsedLabels = [];

    if (this.labels) {
      for (const k in this.labels) {
        const [prefix] = k.split('/');

        if (!SYSTEM_LABELS.includes(prefix)) {
          parsedLabels.push(`${ k }=${ this.labels[k] }`);
        }
      }
    }

    return parsedLabels;
  }

  get isWorker() {
    return this.labels[NODE_ROLES.WORKER] === 'true';
  }

  get isControlPlane() {
    return this.labels[NODE_ROLES.CONTROL_PLANE] === 'true' || this.labels[NODE_ROLES.CONTROL_PLANE_OLD] === 'true';
  }

  get isEtcd() {
    return this.labels[NODE_ROLES.ETCD] === 'true';
  }

  get hasARole() {
    const roleLabelKeys = Object.values(NODE_ROLES);

    return Object.keys(this.labels)
      .some((labelKey) => {
        const hasRoleLabel = roleLabelKeys.includes(labelKey);
        const isExpectedValue = `${ this.labels[labelKey] }` === 'true';

        return hasRoleLabel && isExpectedValue;
      });
  }

  get roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  }

  get version() {
    return this.status.nodeInfo.kubeletVersion;
  }

  get cpuUsage() {
    /*
      With EKS nodes that have been migrated from norman,
      cpu/memory usage is by the annotation `management.cattle.io/pod-requests`
    */
    if ( this.provider === 'eks' ) {
      return parseSi(this.podRequests.cpu || '0');
    }

    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.cpu || '0');
  }

  get cpuCapacity() {
    return parseSi(this.status.allocatable?.cpu);
  }

  get cpuUsagePercentage() {
    return ((this.cpuUsage * 100) / this.cpuCapacity).toString();
  }

  get ramUsage() {
    if ( this.isFromNorman && this.provider === 'eks' ) {
      return parseSi(this.podRequests.memory || '0');
    }

    return parseSi(this.$rootGetters['cluster/byId'](METRIC.NODE, this.id)?.usage?.memory || '0');
  }

  get ramCapacity() {
    return parseSi(this.status.capacity.memory);
  }

  get ramUsagePercentage() {
    return ((this.ramUsage * 100) / this.ramCapacity).toString();
  }

  get ramReserved() {
    return parseSi(this.status?.allocatable?.memory);
  }

  get ramReservedPercentage() {
    return ((this.ramUsage * 100) / this.ramReserved).toString();
  }

  get vramCapacity() {
    return parseSi(this.status.allocatable[NVIDIA.vGPUMem]?.toString(), VRAM_PARSE_RULES.format);
  }

  get vramUsage() {
    if ( !this.vramCapacity ) {
      return '0';
    }
    const gpuDevices = this.$rootGetters['cluster/all'](LLMOS.GPUDEVICE) || [];

    if ( gpuDevices.length < 1 ) {
      return '0';
    }

    const vramUsage = gpuDevices.reduce((acc, gpu) => {
      return acc + gpu.status?.vramUsed;
    }, 0);

    return parseSi(vramUsage.toString(), VRAM_PARSE_RULES.format);
  }

  get vramUsagePercentage() {
    if ( !this.vramCapacity ) {
      return '0';
    }

    return ((this.vramUsage * 100) / this.vramCapacity).toString();
  }

  get podUsage() {
    return calculatePercentage(this.status.allocatable.pods, this.status.capacity.pods);
  }

  get podConsumedUsage() {
    return ((this.podConsumed / this.podCapacity) * 100).toString();
  }

  get podCapacity() {
    return Number.parseInt(this.status.capacity.pods);
  }

  get podConsumed() {
    const runningPods = this.pods.filter((pod) => pod.state === 'running');

    return runningPods.length || 0;
  }

  get podRequests() {
    return JSON.parse(this.metadata.annotations['management.cattle.io/pod-requests'] || '{}');
  }

  get isPidPressureOk() {
    return this.isCondition('PIDPressure', 'False');
  }

  get isDiskPressureOk() {
    return this.isCondition('DiskPressure', 'False');
  }

  get isMemoryPressureOk() {
    return this.isCondition('MemoryPressure', 'False');
  }

  get isKubeletOk() {
    return this.isCondition('Ready');
  }

  get isCordoned() {
    return !!this.spec.unschedulable;
  }

  get drainedState() {
    const sNodeCondition = this.status?.conditions.find((c) => c.type === 'Drained');

    if (sNodeCondition) {
      if (sNodeCondition.status === 'True') {
        return 'drained';
      }
      if (sNodeCondition.transitioning) {
        return 'draining';
      }
    }

    return null;
  }

  get containerRuntimeVersion() {
    return this.status.nodeInfo.containerRuntimeVersion.replace('docker://', '');
  }

  get containerRuntimeIcon() {
    if ( this.status.nodeInfo.containerRuntimeVersion.includes('docker') ) {
      return 'icon-docker';
    }

    return '';
  }

  async cordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.doAction('cordon');
    }));
  }

  async uncordon(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.doAction('uncordon');
    }));
  }

  /**
   *Find the node's cluster id from it's url
   */
  get clusterId() {
    const parts = this.links.self.split('/');

    // Local cluster url links omit `/k8s/clusters/<cluster id>`
    // `/v1/nodes` vs `k8s/clusters/c-m-274kcrc4/v1/nodes`
    // Be safe when determining this, so work back through the url from a known point
    if (parts.length > 6 && parts[parts.length - 6] === 'k8s' && parts[parts.length - 5] === 'clusters') {
      return parts[parts.length - 4];
    }

    return LOCAL;
  }

  drain(resources) {
    this.$dispatch('promptModal', {
      component:      'DrainNode',
      componentProps: { kubeNodes: resources || [this] }
    });
  }

  async stopDrain(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.doAction('stopDrain');
    }));
  }

  get state() {
    if (this.drainedState) {
      return this.drainedState;
    }

    if ( this.isCordoned ) {
      return 'cordoned';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get details() {
    const details = [
      {
        label:   this.t('node.detail.detailTop.version'),
        content: this.version
      },
      {
        label:   this.t('node.detail.detailTop.os'),
        content: this.status.nodeInfo.osImage
      },
      {
        label:         this.t('node.detail.detailTop.containerRuntime'),
        formatter:     'IconText',
        formatterOpts: { iconClass: this.containerRuntimeIcon },
        content:       this.containerRuntimeVersion
      }];

    if (this.internalIp) {
      details.unshift({
        label:     this.t('node.detail.detailTop.internalIP'),
        formatter: 'CopyToClipboard',
        content:   this.internalIp
      });
    }

    if (this.externalIp) {
      details.unshift({
        label:     this.t('node.detail.detailTop.externalIP'),
        formatter: 'CopyToClipboard',
        content:   this.externalIp
      });
    }

    if (this.cudaVersion) {
      details.push({
        label:   this.t('node.detail.detailTop.cudaVersion'),
        content: this.cudaVersion
      });
    }

    return details;
  }

  get pods() {
    const allPods = this.$rootGetters['cluster/all'](POD);

    return allPods.filter((pod) => pod.spec.nodeName === this.name);
  }

  get confirmRemove() {
    return true;
  }

  get canClone() {
    return false;
  }

  get canDelete() {
    const cloudProviders = [
      'aks', 'azureaks', 'azurekubernetesservice',
      'eks', 'amazoneks',
      'gke', 'googlegke'
    ];

    return !cloudProviders.includes(this.provider);
  }

  get provider() {
    return this.$rootGetters['currentCluster'].provisioner.toLowerCase();
  }
}

function calculatePercentage(allocatable, capacity) {
  const c = Number.parseFloat(capacity);
  const a = Number.parseFloat(allocatable);
  const percent = (((c - a) / c) * 100);

  return formatPercent(percent);
}

export function listNodeRoles(isControlPlane, isWorker, isEtcd, allString) {
  const res = [];

  if (isControlPlane) {
    res.push('Control Plane');
  }

  if (isWorker) {
    res.push('Worker');
  }

  if (isEtcd) {
    res.push('Etcd');
  }

  if (res.length === 3) {
    return allString;
  }

  if (res.length === 0) {
    return 'Worker';
  }

  return res.join(', ');
}
