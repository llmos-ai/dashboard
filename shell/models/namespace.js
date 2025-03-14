import SYSTEM_NAMESPACES from '@shell/config/system-namespaces';
import SteveModel from '@shell/plugins/steve/steve-class';
import { PROJECT, SYSTEM_NAMESPACE, RESOURCE_QUOTA } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { hasPSALabels, getPSATooltipsDescription, getPSALabels } from '@shell/utils/pod-security-admission';
import { PSAIconsDisplay, PSALabelsNamespaceVersion } from '@shell/config/pod-security-admission';

const OBSCURE_NAMESPACE_PREFIX = [
  'c-', // cluster namespace

  // Project namespace. When a user creates a project, Rancher creates
  // namespaces in the local cluster with the 'p-' prefix which are
  // used to manage RBAC for the project. If these namespaces are deleted,
  // role bindings can be lost and Rancher may need to be restored from
  // backup. Therefore we hide these namespaces unless the developer setting
  // is turned on from the user preferences.
  'p-',

  'user-', // user namespace
  'local', // local namespace
];

export default class Namespace extends SteveModel {
  get isSystem() {
    if ( this.metadata?.annotations?.[SYSTEM_NAMESPACE] === 'true' ) {
      return true;
    }

    if ( SYSTEM_NAMESPACES.includes(this.metadata.name) ) {
      return true;
    }

    if ( this.metadata.name.endsWith('-system') ) {
      return true;
    }

    if ( this.project ) {
      return this.project.isSystem;
    }

    return false;
  }

  // These are namespaces that are created by rancher to serve purposes in the background but the user shouldn't have
  // to worry themselves about them.
  get isObscure() {
    return OBSCURE_NAMESPACE_PREFIX.some((prefix) => this.metadata.name.startsWith(prefix)) && this.isSystem;
  }

  get projectId() {
    const projectAnnotation = this.metadata?.annotations?.[PROJECT] || '';

    return projectAnnotation.split(':')[1] || null;
  }

  get project() {
    if ( !this.projectId || !this.$rootGetters['isMgmt'] ) {
      return null;
    }

    const clusterId = this.$rootGetters['currentCluster']?.id;
    const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

    return project;
  }

  get groupByLabel() {
    const name = this.project?.nameDisplay;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAProject');
    }
  }

  get confirmRemove() {
    return true;
  }

  get _detailLocation() {
    const _detailLocation = super._detailLocation;

    return _detailLocation;
  }

  get resourceQuota() {
    return JSON.parse(this.metadata.annotations[RESOURCE_QUOTA] || `{"limit":{}}`);
  }

  set resourceQuota(value) {
    this.metadata.annotations[RESOURCE_QUOTA] = JSON.stringify(value);
  }

  get detailTopTooltips() {
    return this.psaTooltipsDescription;
  }

  get detailTopIcons() {
    return PSAIconsDisplay;
  }

  /**
   * Check if resource contains PSA labels
   */
  get hasSystemLabels() {
    return hasPSALabels(this);
  }

  get filteredSystemLabels() {
    return Object.entries(this.labels).reduce((res, [key, value]) => {
      if (!PSALabelsNamespaceVersion.includes(key)) {
        res[key] = value;
      }

      return res;
    }, {});
  }

  /**
   * Generate list of present keys which can be filtered based on existing label keys and system keys
   */
  get systemLabels() {
    return getPSALabels(this);
  }

  get psaTooltipsDescription() {
    return getPSATooltipsDescription(this);
  }

  // Preserve the project label - ensures we preserve project when cloning a namespace
  cleanForNew() {
    const project = this.metadata?.labels?.[PROJECT];

    super.cleanForNew();

    if (project) {
      this.metadata = this.metadata || {};
      this.metadata.labels = this.metadata.labels || {};
      this.metadata.labels[PROJECT] = project;
    }
  }

  get hideDetailLocation() {
    return !!this.$rootGetters['currentProduct'].hideNamespaceLocation;
  }

  get canDelete() {
    // not within the system namespaces
    return !this.isSystem && super.canDelete;
  }
}
