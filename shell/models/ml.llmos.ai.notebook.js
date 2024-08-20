import Vue from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { MANAGEMENT, SERVICE } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default class NoteBook extends SteveModel {
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
                    cpu:    '2',
                    memory: '4Gi'
                  },
                  limits: {}
                },
                volumeMounts: [
                  {
                    mountPath: '/home/jovyan',
                    name:      'data-storage'
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
                name:                  'data-storage',
                persistentVolumeClaim: { claimName: '' }
              },
              {
                emptyDir: { medium: 'Memory' },
                name:     'dshm'
              }
            ]
          }
        },
        volumes: [
          {
            name: '',
            spec: {
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
    const service = services.find((s) => {
      const ownerReferences = s.metadata.ownerReferences || [];

      return ownerReferences.find((o) => o.uid === uid);
    });

    // TODO: use server url for nodePort access
    if (service && this.status?.state === 'Running') {
      const ports = (service.spec.ports || []).find((p) => p.name === 'http');

      if (this.spec.serviceType === 'NodePort') {
        const serverUrl = this.getServerUrl();
        const port = ports.nodePort;

        return `http://${ serverUrl }:${ port }`;
      } else {
        return `https://${ window.location.hostname }:${ window.location.port }/api/v1/namespaces/${ this.metadata.namespace }/services/http:${ service.metadata.name }:${ ports.name }/proxy/`;
      }
    } else {
      return '';
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
