import Vue from 'vue';
import { set } from '@shell/utils/object';
import MlWorkload from '@shell/models/ml_workload';

export default class RayCluster extends MlWorkload {
  applyDefaults() {
    const value = {
      apiVersion: 'ray.io/v1',
      kind:       'RayCluster',
      metadata:   {
        name:        '',
        namespace:   '',
        annotations: {
          'llmos.ai/volume-claim-templates': '[]',
          'ray.io/ft-enabled':               'true',
        }
      },
      spec: {
        rayVersion:        '2.35.0',
        autoscalerOptions: {
          idleTimeoutSeconds: 600,
          resources:          {
            limits: {
              cpu:    '500m',
              memory: '512Mi'
            },
            requests: {
              cpu:    '200m',
              memory: '256Mi'
            }
          },
          upscalingMode: 'Default'
        },
        enableInTreeAutoscaling: true,
        headGroupSpec:           {
          rayStartParams: {
            'num-cpus':       '0',
            'redis-password': '$REDIS_PASSWORD'
          },
          template: {
            metadata: {},
            spec:     {
              containers: [
                {
                  image:     '',
                  lifecycle: {
                    preStop: {
                      exec: {
                        command: [
                          '/bin/sh',
                          '-c',
                          'ray stop'
                        ]
                      }
                    }
                  },
                  name: 'ray-head',
                  env:  [
                    {
                      name:  'RAY_enable_autoscaler_v2',
                      value: '1'
                    }
                  ],
                  ports: [
                    {
                      containerPort: 6379,
                      name:          'redis',
                      protocol:      'TCP'
                    },
                    {
                      containerPort: 8265,
                      name:          'dashboard',
                      protocol:      'TCP'
                    },
                    {
                      containerPort: 10001,
                      name:          'client',
                      protocol:      'TCP'
                    },
                    {
                      containerPort: 8000,
                      name:          'serve',
                      protocol:      'TCP'
                    }
                  ],
                  resources: {
                    requests: {
                      cpu:    '2',
                      memory: '4Gi'
                    },
                    limits: {
                      cpu:    '2',
                      memory: '4Gi'
                    },
                  },
                  volumeMounts: [
                    {
                      mountPath: '/tmp/ray',
                      name:      'ray-logs'
                    }
                  ]
                }
              ],
              volumes: [
                {
                  name:     'ray-logs',
                  emptyDir: {},
                }
              ]
            }
          }
        },
        workerGroupSpecs: [
          {
            groupName:      'default-worker',
            maxReplicas:    5,
            minReplicas:    0,
            replicas:       0,
            rayStartParams: {},
            scaleStrategy:  {},
            template:       {
              metadata: {},
              spec:     {
                containers: [
                  {
                    env: [
                      {
                        name:  'RAY_gcs_rpc_server_reconnect_timeout_s',
                        value: '300'
                      }
                    ],
                    image:     '',
                    lifecycle: {
                      preStop: {
                        exec: {
                          command: [
                            '/bin/sh',
                            '-c',
                            'ray stop'
                          ]
                        }
                      }
                    },
                    name:         'ray-worker',
                    volumeMounts: [
                      {
                        mountPath: '/tmp/ray',
                        name:      'ray-logs'
                      }
                    ],
                    resources: {
                      requests: {
                        cpu:    '4',
                        memory: '8Gi'
                      },
                      limits: {
                        cpu:    '4',
                        memory: '8Gi'
                      }
                    }
                  }
                ],
                volumes: [
                  {
                    name:     'ray-logs',
                    emptyDir: {},
                  }
                ],
              }
            }
          }
        ]
      }
    };

    Vue.set(this, 'metadata', value.metadata);
    set(this, 'spec', this.spec || value.spec);
  }

  redeploy() {
    // Redeploy Ray workload by deleting its pods
    const pods = this.pods || [];

    for (const pod of pods) {
      pod.remove();
    }

    this.$dispatch('growl/info', { message: `${ this.kind } ${ this.name } has been successfully redeployed.` }, { root: true });
  }

  get details() {
    return [
      ...super.details,
      {
        label:   this.t('mlWorkload.detail.detailTop.workers'),
        content: this.workerReady,
      },
      {
        label:   this.t('mlWorkload.detail.detailTop.workerReplicas'),
        content: this.workerReplicaRange,
      }];
  }

  get workerReady() {
    return `${ this.status.readyWorkerReplicas }/${ this.status.desiredWorkerReplicas }`;
  }

  get workerReplicaRange() {
    return `${ this.status.minWorkerReplicas }-${ this.status.maxWorkerReplicas }`;
  }
}
