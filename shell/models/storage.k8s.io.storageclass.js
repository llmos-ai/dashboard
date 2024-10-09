import { STORAGE } from '@shell/config/labels-annotations';
import { STORAGE_CLASS } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';

// These are storage class drivers w/ custom components
// all but longhorn are in-tree plugins
export const PROVISIONER_OPTIONS = [
  {
    labelKey: 'storageClass.custom.title',
    value:    'custom',
  },
  {
    labelKey: 'storageClass.rbd.title',
    value:    'kubernetes.io/rbd',
  },
  {
    labelKey: 'storageClass.glusterfs.title',
    value:    'kubernetes.io/glusterfs',
  },
  {
    labelKey: 'storageClass.no-provisioner.title',
    value:    'kubernetes.io/no-provisioner',
  },
  {
    labelKey: 'storageClass.longhorn.title',
    value:    'driver.longhorn.io',
  },
  {
    labelKey: 'storageClass.portworx-volume.title',
    value:    'kubernetes.io/portworx-volume',
  },
  {
    labelKey: 'storageClass.quobyte.title',
    value:    'kubernetes.io/quobyte',
  },
  {
    labelKey: 'storageClass.scaleio.title',
    value:    'kubernetes.io/scaleio',
  },
  {
    labelKey: 'storageClass.storageos.title',
    value:    'kubernetes.io/storageos',
  },
  {
    labelKey:  'storageClass.local-path-provisioner.title',
    value:     'rancher.io/local-path',
    supported: true,
  },
  {
    labelKey:  'storageClass.ceph-cephfs-provisioner.title',
    value:     'storage-system.cephfs.csi.ceph.com',
    supported: true,
  },
  {
    labelKey:  'storageClass.ceph-rbd-provisioner.title',
    value:     'storage-system.rbd.csi.ceph.com',
    supported: true,
  }
];

export default class extends SteveModel {
  get provisionerDisplay() {
    const option = PROVISIONER_OPTIONS.find((o) => o.value === this.provisioner);
    const fallbackStr = `${ this.provisioner } ${ this.t('persistentVolume.csi.drivers.suffix') }`;

    let fallback = this.$rootGetters['i18n/withFallback'](`persistentVolume.csi.drivers.${ this.provisioner.replaceAll('.', '-') }`, null, fallbackStr);

    if (!option && fallback.includes('undefined')) {
      fallback = this.provisioner;
    }

    return option ? this.t(option.labelKey) : fallback;
  }

  get isDefault() {
    return this.annotations[STORAGE.DEFAULT_STORAGE_CLASS] === 'true';
  }

  updateDefault(value) {
    // Update model so that the list reflects the change straight away
    this.setAnnotation(STORAGE.DEFAULT_STORAGE_CLASS, value.toString());
    this.setAnnotation(STORAGE.BETA_DEFAULT_STORAGE_CLASS, value.toString());

    // Patch the annotations rather than saving the whole object, as ssome storage classes
    // won't allow the complete object to be saved again
    const data = {
      metadata: {
        annotations: {
          [STORAGE.DEFAULT_STORAGE_CLASS]:      value.toString(),
          [STORAGE.BETA_DEFAULT_STORAGE_CLASS]: value.toString()
        }
      }
    };

    return this.patch(data, {}, true, true);
  }

  setDefault() {
    const allStorageClasses = this.$rootGetters['cluster/all'](STORAGE_CLASS) || [];

    allStorageClasses.forEach((storageClass) => storageClass.resetDefault());
    this.updateDefault(true);
  }

  resetDefault() {
    if (this.isDefault) {
      this.updateDefault(false);
    }
  }

  get _availableActions() {
    const out = super._availableActions;

    if (this.isDefault) {
      out.unshift({
        action:  'resetDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.resetDefault'),
      });
    } else {
      out.unshift({
        action:  'setDefault',
        enabled: true,
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('storageClass.actions.setAsDefault'),
      });
    }

    return out;
  }

  get isLLMOSRelease() {
    return this.annotations?.['meta.helm.sh/release-name'] === 'llmos-ceph-cluster';
  }

  get canDelete() {
    // not include llmos-ceph-cluster
    return !this.isLLMOSRelease && super.canDelete;
  }
}
