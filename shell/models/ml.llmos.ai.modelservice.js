import Vue from 'vue';
import { set } from '@shell/utils/object';
import MlWorkload from '@shell/models/ml_workload';

export default class ModelService extends MlWorkload {
  applyDefaults() {
    const value = {
      apiVersion: 'ml.llmos.ai/v1',
      kind:       'ModelService',
      metadata:   {
        name:        '',
        namespace:   '',
        labels:      {},
        annotations: {},
      },
      spec: {
        replicas:        1,
        model:           '',
        servedModelName: '',
        serviceType:     'ClusterIP',
        updateStrategy:  { type: 'RollingUpdate' },
        template:        {
          spec: {
            runtimeClassName: 'nvidia',
            containers:       [
              {
                args:  [],
                image: 'vllm/vllm-openai:v0.6.3',
                name:  'server',
                ports: [
                  {
                    containerPort: 8000,
                    name:          'http',
                    protocol:      'TCP'
                  }
                ],
                env: [
                ],
                resources: {
                  requests: {
                    cpu:              '4',
                    memory:           '10Gi',
                    'nvidia.com/gpu': '1'
                  },
                  limits: {
                    cpu:              '4',
                    memory:           '10Gi',
                    'nvidia.com/gpu': '1'
                  }
                },
                volumeMounts: [
                  {
                    mountPath: '/root/.cache/huggingface',
                    name:      'hf-dir'
                  },
                  {
                    mountPath: '/dev/shm',
                    name:      'dshm'
                  }
                ]
              }
            ],
            volumes: [
              {
                emptyDir: { medium: 'Memory' },
                name:     'dshm'
              }
            ]
          }
        },
        volumeClaimTemplates: [
          {
            metadata: { name: 'hf-dir' },
            spec:     {
              accessModes: ['ReadWriteOnce'],
              resources:   { requests: { storage: '20Gi' } },
            },
          },
        ]
      }
    };

    Vue.set(this, 'metadata', value.metadata);
    set(this, 'spec', this.spec || value.spec);
  }

  get readyReplicas() {
    return `${ this.available }/${ this.spec?.replicas }`;
  }

  get modelName() {
    return this.spec.servedModelName.length > 0 ? this.spec.servedModelName : this.spec.model;
  }

  get details() {
    return [
      ...super.details,
      {
        label:   this.t('mlWorkload.detail.detailTop.modelName'),
        content: this.modelName,
      }];
  }

  remove() {
    const opt = { ...arguments };

    opt.params = { propagationPolicy: 'Foreground' };

    return this._remove(opt);
  }
}
