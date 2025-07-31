import { message } from 'ant-design-vue';

import SteveModel from '@shell/plugins/steve/steve-class';
import { LLMOS } from '@shell/config/types';
import { set } from '@shell/utils/object';

export default class LocalModelVersion extends SteveModel {
  applyDefaults() {
    const value = {
      metadata: {
        name:        '',
        namespace:   '',
        labels:      {},
        annotations: {},
      },
      spec: {},
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get localModelVersions() {
    return this.$getters['all'](LLMOS.LOCAL_MODEL_VERSION).filter(
      (version) => version.metadata.namespace === this.metadata.namespace &&
        version.spec?.localModel === this.metadata.name
    );
  }

  get localModelVersionOptions() {
    return this.localModelVersions
      .filter((version) => version.isReady)
      .map((version) => ({
        label: version.metadata.name.replace(`${ this.metadata.name }-`, ''),
        value: version.id,
        age:   version.creationTimestamp,
      }))
      .sort((a = {}, b = {}) => {
        const aVersion = parseInt((a.label || '').replace(`v`, ''));
        const bVersion = parseInt((b.label || '').replace(`v`, ''));

        return bVersion - aVersion;
      });
  }

  get latestLocalModelVersion() {
    const version = this.localModelVersionOptions[0] || {};

    return version.label || 'v0';
  }

  get nextVersion() {
    const latestVersionNumber = this.latestLocalModelVersion.replace('v', '');

    const nextVersionNumber = Number(latestVersionNumber) + 1;

    return `v${ nextVersionNumber }`;
  }

  get availableActions() {
    const out = super._availableActions;

    const fetchOrigin = {
      action:  'fetchOrigin',
      enabled: true,
      icon:    'icon icon-copy',
      label:   this.t('localModel.actions.fetchOrigin.label'),
    };

    out.unshift(fetchOrigin);

    return out;
  }

  async fetchOrigin() {
    try {
      const newLocalModel = this;
      const localModelName = newLocalModel?.metadata?.name;
      const versionToCreate = newLocalModel.nextVersion;

      const localModelVersion = await this.$dispatch(`create`, {
        type:     LLMOS.LOCAL_MODEL_VERSION,
        metadata: {
          name:      `${ localModelName }-${ versionToCreate }`,
          namespace: this.metadata?.namespace,
        },
        spec: { localModel: localModelName },
      });

      await localModelVersion.save();

      message.success(
        this.t('localModel.actions.createVersion.success', {
          localModelName,
          version: versionToCreate,
        })
      );
    } catch (err) {
      message.error(`${ err.message || err }`);
    }
  }

  get defaultLocalModelVersion() {
    return (
      this.$getters['byId'](
        LLMOS.LOCAL_MODEL_VERSION,
        `${ this.metadata.namespace }/${ this.spec.defaultVersion }`
      ) || {}
    );
  }

  get model() {
    return this.$getters['byId'](LLMOS.MODEL, this.id) || {};
  }

  get iconUrl() {
    return this.model.iconUrl;
  }
}
