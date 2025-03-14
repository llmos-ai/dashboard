import { set } from '@shell/utils/object';
import MlWorkload from '@shell/models/ml_workload';

export default class NoteBook extends MlWorkload {
  applyDefaults() {
    const value = {
      apiVersion: 'ml.llmos.ai/v1',
      kind:       'Notebook',
      metadata:   {
        name:        '',
        namespace:   '',
        labels:      { 'ml.llmos.ai/notebook-type': 'jupyter' },
        annotations: {},
      },
      spec: {
        replicas: 1,
        template: {
          spec: {
            containers: [
              {
                image:     '',
                name:      'notebook',
                resources: {
                  requests: {
                    cpu:    '1',
                    memory: '2Gi'
                  },
                  limits: {
                    cpu:    '2',
                    memory: '4Gi'
                  }
                },
                volumeMounts: [
                  {
                    mountPath: '/home/jovyan',
                    name:      'home-dir'
                  },
                  {
                    mountPath: '/dev/shm',
                    name:      'dshm',
                  }
                ]
              }
            ],
            volumes: [
              {
                emptyDir: {
                  medium:    'Memory',
                  sizeLimit: '1024Mi'
                },
                name: 'dshm',
              }
            ]
          }
        },
        volumeClaimTemplates: [
          {
            metadata: { name: 'home-dir' },
            spec:     {
              accessModes: ['ReadWriteOnce'],
              resources:   { requests: { storage: '5Gi' } },
            },
          },
        ]
      }
    };

    this.metadata = value.metadata;
    set(this, 'spec', this.spec || value.spec);
  }

  get notebookType() {
    return this.metadata.labels['ml.llmos.ai/notebook-type'];
  }

  get details() {
    return [
      ...super.details,
      {
        label:   this.t('mlWorkload.detail.detailTop.notebookType'),
        content: this.notebookType,
      }];
  }

  remove() {
    const opt = { ...arguments };

    opt.params = { propagationPolicy: 'Foreground' };

    return this._remove(opt);
  }
}
