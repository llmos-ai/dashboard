import { set } from "@shell/utils/object";
import MlWorkload from "@shell/models/ml_workload";
import { NVIDIA } from "@shell/utils/container-resource";

export default class ModelService extends MlWorkload {
  applyDefaults() {
    const value = {
      apiVersion: "ml.llmos.ai/v1",
      kind: "ModelService",
      metadata: {
        name: "",
        namespace: "",
        labels: {},
        annotations: {},
      },
      spec: {
        replicas: 1,
        modelRegistry: "huggingface",
        model: "",
        servedModelName: "",
        serviceType: "ClusterIP",
        updateStrategy: { type: "RollingUpdate" },
        template: {
          spec: {
            runtimeClassName: "nvidia",
            containers: [
              {
                args: [],
                image: "",
                name: "server",
                ports: [
                  {
                    containerPort: 8000,
                    name: "http",
                    protocol: "TCP",
                  },
                ],
                env: [],
                resources: {
                  requests: {
                    cpu: "4",
                    memory: "10Gi",
                  },
                  limits: {
                    cpu: "4",
                    memory: "10Gi",
                    [NVIDIA.vGPU]: "1",
                  },
                },
                volumeMounts: [
                  {
                    mountPath: "/root/.cache",
                    name: "model-dir",
                  },
                  {
                    mountPath: "/dev/shm",
                    name: "dshm",
                  },
                ],
              },
            ],
            volumes: [
              {
                emptyDir: {
                  medium: "Memory",
                  sizeLimit: "16384Mi",
                },
                name: "dshm",
              },
            ],
          },
        },
        volumeClaimTemplates: [
          {
            metadata: { name: "model-dir" },
            spec: {
              accessModes: ["ReadWriteOnce"],
              resources: { requests: { storage: "20Gi" } },
            },
          },
        ],
      },
    };

    this["metadata"] = value.metadata;
    set(this, "spec", this.spec || value.spec);
  }

  get modelApi() {
    const namespace = this.namespace;

    return `/api/v1/namespaces/${namespace}/services/modelservice-${this.metadata.name}:http/proxy/v1/chat/completions`;
  }

  get readyReplicas() {
    return `${this.available}/${this.spec?.replicas}`;
  }

  get modelName() {
    return this.spec.servedModelName?.length > 0
      ? this.spec.servedModelName
      : this.spec.model;
  }

  get details() {
    return [
      ...super.details,
      {
        label: this.t("mlWorkload.detail.detailTop.modelName"),
        content: this.modelName,
      },
    ];
  }

  remove() {
    const opt = { ...arguments };

    opt.params = { propagationPolicy: "Foreground" };

    return this._remove(opt);
  }
}
