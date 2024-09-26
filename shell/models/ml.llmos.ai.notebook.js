import Vue from 'vue';
import { set } from '@shell/utils/object';
import { MANAGEMENT, SERVICE } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import LLMOSWorkload from '@shell/models/llmos-workload';

export default class NoteBook extends LLMOSWorkload {
  applyDefaults() {
    const value = {
      apiVersion: 'ml.llmos.ai/v1',
      kind:       'Notebook',
      metadata:   {
        name:      '',
        namespace: '',
        labels:    { 'ml.llmos.ai/notebook-type': 'jupyter' },
      },
      spec: {
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
            metadata: { name: 'home-dir' },
            spec:     {
              accessModes: ['ReadWriteOnce'],
              resources:   { requests: { storage: '5Gi' } },
            },
          },
        ]
      }
    };

    Vue.set(this, 'metadata', value.metadata);
    set(this, 'spec', this.spec || value.spec);
  }

  get notebookType() {
    return this.metadata.labels['ml.llmos.ai/notebook-type'];
  }

  getServerUrl() {
    const serverUrl = this.$getters['byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    if (serverUrl.value !== '') {
      return serverUrl.value;
    }

    return serverUrl.default;
  }

  get connectUrl() {
    const uid = this.metadata.uid;
    const services = this.$rootGetters['cluster/all'](SERVICE) || [];
    const svc = services.find((s) => {
      const ownerReferences = s.metadata.ownerReferences || [];

      return ownerReferences.find((o) => o.uid === uid);
    });

    if (!svc || this.status?.state !== 'Running') {
      return '';
    }

    const serverURL = this.getServerUrl() || window.location.origin;
    const url = new URL(serverURL);

    const port = svc.spec.ports[0];

    switch (svc.spec.type) {
    case 'NodePort':
      return `http://${ url.hostname }:${ port.nodePort }/`;
    case 'LoadBalancer':
      return `http://${ url.hostname }:${ port.port }/`;
    default:
      return `${ window.location.origin }/api/v1/namespaces/${ svc.namespace }/services/${ svc.name }:${ port.name }/proxy/`;
    }
  }

  get gpus() {
    const limit = this.spec.template.spec.containers[0].resources.limit;

    if (limit === null || limit === undefined) {
      return 0;
    }

    if (limit['nvidia.com/gpu']) {
      return limit['nvidia.com/gpu'];
    }

    return 0;
  }

  get cpusRequest() {
    const requests = this.spec.template.spec.containers[0].resources?.requests;

    if (requests === null || requests.cpu === null) {
      return 0;
    }

    return requests.cpu;
  }

  get memoryRequest() {
    const requests = this.spec.template.spec.containers[0].resources?.requests;

    if (requests === null || requests.memory === null) {
      return 0;
    }

    return requests.memory;
  }
}
