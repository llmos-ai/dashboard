import { CLUSTER_BADGE } from '@shell/config/labels-annotations';
import { NODE, MANAGEMENT } from '@shell/config/types';
import { insertAt, addObject, removeObject } from '@shell/utils/array';
import { downloadFile } from '@shell/utils/download';
import { parseSi } from '@shell/utils/units';
import { parseColor, textColor } from '@shell/utils/color';
import jsyaml from 'js-yaml';
import { eachLimit } from '@shell/utils/promise';
import { isEmpty } from '@shell/utils/object';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
import { copyTextToClipboard } from '@shell/utils/clipboard';

// See translation file cluster.providers for list of providers
// If the logo is not named with the provider name, add an override here
const PROVIDER_LOGO_OVERRIDE = {};

export default class MgmtCluster extends HybridModel {
  get details() {
    const out = [
      {
        label:   'Kubernetes Version',
        content: this.kubernetesVersion,
      },
    ];

    return out;
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:  'openShell',
      label:   this.t('nav.shell'),
      icon:    'icon icon-terminal',
      enabled: !!this.links.shell,
    });

    insertAt(out, 1, {
      action:     'downloadKubeConfig',
      bulkAction: 'downloadKubeConfigBulk',
      label:      this.t('nav.kubeconfig.download'),
      icon:       'icon icon-download',
      bulkable:   true,
      enabled:    this.$rootGetters['isMgmt'] && this.hasAction('generateKubeconfig'),
    });

    insertAt(out, 2, {
      action:   'copyKubeConfig',
      label:    this.t('cluster.copyConfig'),
      bulkable: false,
      enabled:  this.$rootGetters['isMgmt'] && this.hasAction('generateKubeconfig'),
      icon:     'icon icon-copy',
    });

    return out;
  }

  get canDelete() {
    return this.hasLink('remove') && !this?.spec?.internal;
  }

  get provisioner() {
    if (this.status?.provider ) {
      return this.status.provider;
    }

    // For imported K3s clusters, this.status.driver is 'k3s.'
    return this.status?.driver ? this.status.driver : 'imported';
  }

  get groupByLabel() {
    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
  }

  get isReady() {
    // If the Connected condition exists, use that (2.6+)
    if ( this.hasCondition('Connected') ) {
      return this.isCondition('Connected');
    }

    // Otherwise use Ready (older)
    return this.isCondition('Ready');
  }

  get kubernetesVersionRaw() {
    const fromStatus = this.status?.version?.gitVersion;
    const fromSpec = this.spec?.[`${ this.provisioner }Config`]?.kubernetesVersion;

    return fromStatus || fromSpec;
  }

  get kubernetesVersion() {
    return this.kubernetesVersionRaw || this.$rootGetters['i18n/t']('generic.provisioning');
  }

  get kubernetesVersionBase() {
    return this.kubernetesVersion.replace(/[+-].*$/, '');
  }

  get kubernetesVersionExtension() {
    if ( this.kubernetesVersion.match(/[+-]/) ) {
      return this.kubernetesVersion.replace(/^.*([+-])/, '$1');
    }

    return '';
  }

  get providerOs() {
    if (this.status?.provider.endsWith('.windows')) {
      return 'windows';
    }

    return 'linux';
  }

  get providerOsLogo() {
    return require(`~shell/assets/images/vendor/${ this.providerOs }.svg`);
  }

  get isLocal() {
    return this.spec?.internal === true;
  }

  get providerLogo() {
    if (this.id === 'local') {
      return require(`~shell/assets/images/providers/kubernetes.svg`);
    }

    const provider = this.status?.provider || 'kubernetes';

    // Only interested in the part before the period
    const prv = provider.split('.')[0];
    // Allow overrides if needed
    const logo = PROVIDER_LOGO_OVERRIDE[prv] || prv;

    let icon;

    try {
      icon = require(`~shell/assets/images/providers/${ prv }.svg`);
    } catch (e) {
      console.warn(`Can not find provider logo for provider ${ logo }`); // eslint-disable-line no-console
      // Use fallback generic Kubernetes icon
      icon = require(`~shell/assets/images/providers/kubernetes.svg`);
    }

    return icon;
  }

  get llmLogo() {
    return require(`~shell/assets/images/providers/llm.svg`);
  }

  get llmNavLogo() {
    return this.llmLogo;
  }

  get providerMenuLogo() {
    return this.providerLogo;
  }

  get providerNavLogo() {
    return this.providerLogo;
  }

  // Custom badge to show for the Cluster (if the appropriate annotations are set)
  get badge() {
    const text = this.metadata?.annotations?.[CLUSTER_BADGE.TEXT];

    if (!text) {
      return undefined;
    }

    const color = this.metadata?.annotations[CLUSTER_BADGE.COLOR] || '#7f7f7f';
    const iconText = this.metadata?.annotations[CLUSTER_BADGE.ICON_TEXT] || '';

    return {
      text,
      color,
      textColor: textColor(parseColor(color)),
      iconText:  iconText.substr(0, 2)
    };
  }

  get scope() {
    return this.isLocal ? 'management' : 'downstream';
  }

  setClusterNameLabel(andSave) {
    if ( this.ownerReferences?.length ) {
      return;
    }

    this.metadata = this.metadata || {};
    this.metadata.labels = this.metadata.labels || {};

    if ( andSave ) {
      return this.save();
    }
  }

  get availableCpu() {
    const reserved = parseSi(this.status.requested?.cpu);
    const allocatable = parseSi(this.status.allocatable?.cpu);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  }

  get availableMemory() {
    const reserved = parseSi(this.status.requested?.memory);
    const allocatable = parseSi(this.status.allocatable?.memory);

    if ( allocatable > 0 && reserved >= 0 ) {
      return Math.max(0, allocatable - reserved);
    } else {
      return null;
    }
  }

  openShell() {
    this.$dispatch('wm/open', {
      id:        `kubectl-${ this.id }`,
      label:     this.$rootGetters['i18n/t']('wm.kubectlShell.title', { name: this.nameDisplay }),
      icon:      'terminal',
      component: 'KubectlShell',
      attrs:     {
        cluster: this,
        pod:     {}
      }
    }, { root: true });
  }

  async generateKubeConfig() {
    const res = await this.doAction('generateKubeconfig');

    return res.config;
  }

  async downloadKubeConfig() {
    const config = await this.generateKubeConfig();

    downloadFile(`${ this.nameDisplay }.yaml`, config, 'application/yaml');
  }

  async downloadKubeConfigBulk(items) {
    let obj = {};
    let first = true;

    await eachLimit(items, 10, (item, idx) => {
      return item.generateKubeConfig().then((config) => {
        const entry = jsyaml.load(config);

        if ( first ) {
          obj = entry;
          first = false;
        } else {
          obj.clusters.push(...entry.clusters);
          obj.users.push(...entry.users);
          obj.contexts.push(...entry.contexts);
        }
      });
    });

    delete obj['current-context'];

    const out = jsyaml.dump(obj);

    downloadFile('kubeconfig.yaml', out, 'application/yaml');
  }

  async copyKubeConfig() {
    try {
      const config = await this.generateKubeConfig();

      if (config) {
        await copyTextToClipboard(config);
      }
    } catch {}
  }

  async fetchNodeMetrics() {
    const nodes = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });
    const nodeMetrics = await this.$dispatch('cluster/findAll', { type: NODE }, { root: true });

    const someNonWorkerRoles = nodes.some((node) => node.hasARole && !node.isWorker);

    const metrics = nodeMetrics.filter((metric) => {
      const node = nodes.find((nd) => nd.id === metric.id);

      return node && (!someNonWorkerRoles || node.isWorker);
    });
    const initialAggregation = {
      cpu:    0,
      memory: 0
    };

    if (isEmpty(metrics)) {
      return null;
    }

    return metrics.reduce((agg, metric) => {
      agg.cpu += parseSi(metric?.usage?.cpu);
      agg.memory += parseSi(metric?.usage?.memory);

      return agg;
    }, initialAggregation);
  }

  get nodes() {
    return this.$getters['all'](MANAGEMENT.NODE).filter((node) => node.id.startsWith(this.id));
  }

  get pinned() {
    return this.$rootGetters['prefs/get'](PINNED_CLUSTERS).includes(this.id);
  }

  pin() {
    const types = this.$rootGetters['prefs/get'](PINNED_CLUSTERS) || [];

    addObject(types, this.id);

    this.$dispatch('prefs/set', { key: PINNED_CLUSTERS, value: types }, { root: true });
  }

  unpin() {
    const types = this.$rootGetters['prefs/get'](PINNED_CLUSTERS) || [];

    removeObject(types, this.id);

    this.$dispatch('prefs/set', { key: PINNED_CLUSTERS, value: types }, { root: true });
  }
}
