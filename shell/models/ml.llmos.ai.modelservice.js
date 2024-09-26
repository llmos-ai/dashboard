import Vue from 'vue';
import { set } from '@shell/utils/object';
import LLMOSWorkload from '@shell/models/llmos-workload';

export default class ModelService extends LLMOSWorkload {
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
        enabledGUI:      false,
        serviceType:     'ClusterIP',
        updateStrategy:  { type: 'RollingUpdate' },
        template:        {
          spec: {
            runtimeClassName: 'nvidia',
            containers:       [
              {
                args:  [],
                image: 'vllm/vllm-openai:v0.5.4',
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

  get msStatus() {
    return this.status?.state || 'Pending';
  }

  get modelName() {
    return this.spec.servedModelName.length > 0 ? this.spec.servedModelName : this.spec.model;
  }
}
