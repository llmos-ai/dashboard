import Vue from 'vue';
import SteveModel from '@shell/plugins/steve/steve-class';
import { set } from '@shell/utils/object';
import { colorForState, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export default class RayCluster extends SteveModel {
  applyDefaults() {
    const value = {
      apiVersion: 'ray.io/v1',
      kind:       'RayCluster',
      metadata:   {
        name:        '',
        namespace:   '',
        annotations: {
          'llmos.ai/volumeClaimTemplates': '[{"metadata":{"name":""},"spec":{"accessModes":["ReadWriteOnce"],"resources":{"requests":{"storage":"2Gi"}}}}]',
          'ray.io/ft-enabled':             'true',
        }
      },
      spec: {
        rayVersion:        '2.31.0',
        autoscalerOptions: {
          idleTimeoutSeconds: 60,
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
                  name:  'ray-head',
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
                      cpu:    '1',
                      memory: '2Gi'
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
                  name:                  'ray-logs',
                  persistentVolumeClaim: { claimName: '' }
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

  get stateDisplay() {
    if (this.status?.state === 'failed') {
      return STATES_ENUM.ERROR;
    }

    if (this.metadata?.deletionTimestamp) {
      return STATES_ENUM.REMOVING;
    }

    return this.stateDescription ? STATES_ENUM.PENDING : super.stateDisplay;
  }

  get stateBackground() {
    const color = colorForState(this.stateDisplay);

    return color.replace('text-', 'bg-');
  }

  get stateDescription() {
    if (this.status?.state === 'failed') {
      return this.status?.reason;
    }

    const relationships = this.metadata.relationships || [];
    const hasIssue = relationships.find((r) => {
      if (r.error === true || r.transitioning === true) {
        return r;
      }
    });

    if (hasIssue) {
      return hasIssue.message;
    }

    return false;
  }

  get rayVersion() {
    const version = this.spec?.rayVersion;

    if (version) {
      return version;
    }

    const image = this.spec.headGroupSpec?.template?.spec?.containers?.[0]?.image;

    if (image) {
      return image.split(':')[1];
    }

    return 'N/A';
  }
}
