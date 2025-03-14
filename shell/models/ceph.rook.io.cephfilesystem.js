import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';

export default class CephFileSystem extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: 'ceph.rook.io/v1',
      kind:       'CephFilesystem',
      metadata:   {
        name:        '',
        namespace:   'storage-system',
        labels:      {},
        annotations: {},
      },
      spec: {
        metadataPool: {
          failureDomain: 'host',
          replicated:    { size: 3 },
        },
        dataPools: [
          {
            name:          'data0',
            failureDomain: 'host',
            replicated:    { size: 3 },
          },
        ],
        preserveFilesystemOnDelete: false,
        metadataServer:             {
          activeCount:       1,
          activeStandby:     true,
          priorityClassName: 'system-cluster-critical',
          resources:         {
            requests: {
              cpu:    '500m',
              memory: '1Gi'
            },
            limits: { memory: '4Gi' },
          }
        }
      }
    };

    this['metadata'] = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get isLLMOSRelease() {
    return this.annotations?.['meta.helm.sh/release-name'] === 'llmos-ceph-cluster';
  }

  get canDelete() {
    // not include llmos-ceph-cluster
    return !this.isLLMOSRelease && super.canDelete;
  }

  get canUpdate() {
    return !this.isLLMOSRelease && super.canUpdate;
  }
}
