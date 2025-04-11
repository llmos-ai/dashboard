import { mapGetters } from 'vuex';
import { cleanUp } from '@shell/utils/object';
import {
  CONFIG_MAP,
  SECRET,
  NODE,
  PVC,
  SERVICE_ACCOUNT,
  RUNTIME_CLASS,
} from '@shell/config/types';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import EnvVars from '@shell/components/form/EnvVars.vue';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import NodeScheduling from '@shell/components/form/NodeScheduling';
import CruResource from '@shell/components/CruResource';
import ValueFromResource from '@shell/components/form/ValueFromResource.vue';
import ShellInput from '@shell/components/form/ShellInput.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceManager from '@shell/mixins/resource-manager';
import Loading from '@shell/components/Loading';
import { _EDIT, _CLONE } from '@shell/config/query-params';
import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import { TYPES as SECRET_TYPES } from '@shell/models/secret';
import { allHash } from '@shell/utils/promise';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Volume from '@shell/edit/volume/index.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { LabeledInput } from '@shell/components/form/LabeledInput';
import { Checkbox } from '@shell/components/form/Checkbox';
import Resource from '@shell/plugins/dashboard-store/resource-class';
import { FlatResources, NVIDIA, VolcanoScheduler } from '@shell/utils/container-resource';
import { PullPolicyOptions, SvcOptions } from '@shell/config/constants';

const TAB_WEIGHT_MAP = {
  general:        99,
  resources:      98,
  volumes:        97,
  labels:         96,
  nodeScheduling: 90,
};

// LLMOS Workload handle the common logic of statefulSet pod spec template
export default {
  name:       'LLMOSWorkloadMixin',
  components: {
    AdvancedSection,
    ContainerResourceLimit,
    CruResource,
    Checkbox,
    EnvVars,
    Loading,
    LabeledInput,
    LabeledSelect,
    NameNsDescription,
    NodeScheduling,
    ResourceTabs,
    ShellInput,
    Tab,
    ValueFromResource,
    Volume,
    Resource,
  },

  mixins: [CreateEditView, ResourceManager],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    createOption: {
      default: (text) => {
        if (text) {
          return { metadata: { name: text } };
        }
      },
      type: Function
    },
  },

  async fetch() {
    // User might not have access to these resources - so check before trying to fetch
    const fetches = {};

    await allHash(fetches);

    // don't block UI for these resources
    await this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const type = this.$route.params.resource;
    const spec = this.value.spec;

    if (!spec) {
      throw new Error('LLMOSWorkload: No spec found in workload');
    }
    const container = spec.template.spec.containers[0];

    // init env and volumeClaimTemplates if not exist
    if (!container.env) {
      container['env'] = [];
    }

    if (!this.value.spec.volumeClaimTemplates) {
      this.value.spec['volumeClaimTemplates'] = [];
    }

    return {
      secondaryResourceData: this.secondaryResourceDataConfig(),
      namespacedConfigMaps:  [],
      allNodes:              null,
      allNodeObjects:        [],
      namespacedSecrets:     [],
      name:                  this.value?.metadata?.name || null,
      pvcs:                  [],
      namespacedPvcs:        [],
      pullPolicyOptions:     PullPolicyOptions,
      svcOptions:            SvcOptions,
      savePvcHookName:       'savePvcHook',
      tabWeightMap:          TAB_WEIGHT_MAP,
      isNamespaceNew:        false,
      runtimeClasses:        [],
      type,
      spec,
      container,
    };
  },

  computed: {
    isEdit() {
      return this.mode === _EDIT;
    },

    podTemplateSpec: {
      get() {
        return this.spec.template.spec;
      },
      set(neu) {
        this.spec.template['spec'] = neu;
      },
    },

    podLabels: {
      get() {
        if (!this.spec.template.metadata) {
          this.spec.template['metadata'] = { labels: {} };
        }

        return this.spec.template.metadata.labels;
      },
      set(neu) {
        this.spec.template.metadata['labels'] = neu;
      },
    },

    podAnnotations: {
      get() {
        if (!this.spec.template.metadata) {
          this.spec.template['metadata'] = { annotations: {} };
        }

        return this.spec.template.metadata.annotations;
      },
      set(neu) {
        this.spec.template.metadata['annotations'] = neu;
      },
    },

    flatResources: {
      get() {
        return FlatResources.get(this.container);
      },
      set(neu) {
        const out = FlatResources.set(neu);

        this.container['resources'] = cleanUp(out);
      }
    },

    healthCheck: {
      get() {
        const { readinessProbe, livenessProbe, startupProbe } = this.container;

        return {
          readinessProbe,
          livenessProbe,
          startupProbe,
        };
      },
      set(neu) {
        Object.assign(this.container, neu);
      },
    },

    imagePullSecrets: {
      get() {
        if (!this.podTemplateSpec.imagePullSecrets) {
          this.podTemplateSpec['imagePullSecrets'] = [];
        }

        const { imagePullSecrets } = this.podTemplateSpec;

        return imagePullSecrets.map((each) => each.name);
      },
      set(neu) {
        this.podTemplateSpec.imagePullSecrets = neu.map((secret) => {
          return { name: secret };
        });
      },
    },

    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
    },

    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    async 'value.metadata.namespace'(neu) {
      if (this.isNamespaceNew) {
        // we don't need to re-fetch namespace specific (or non-namespace specific) resources when the namespace hasn't been created yet
        return;
      }
      this.secondaryResourceData.namespace = neu;
      // Fetch resources that are namespace specific, we don't need to re-fetch non-namespaced resources on namespace change
      this.resourceManagerFetchSecondaryResources(this.secondaryResourceData, true);
    },

    isNamespaceNew(neu, old) {
      if (!old && neu) {
        // As the namespace is new any resource that's been fetched with a namespace is now invalid
        this.resourceManagerClearSecondaryResources(this.secondaryResourceData, true);
      }
    },
  },

  created() {
    this.registerBeforeHook(this.saveWorkload, 'willSaveWorkload');
  },

  methods: {
    secondaryResourceDataConfig() {
      return {
        namespace: this.value?.metadata?.namespace || null,
        data:      {
          [CONFIG_MAP]:      { applyTo: [{ var: 'namespacedConfigMaps' }] },
          [SERVICE_ACCOUNT]: { applyTo: [{ var: 'namespacedServiceNames' }] },
          [RUNTIME_CLASS]:   { applyTo: [{ var: 'runtimeClasses' }] },
          [PVC]:             {
            applyTo: [
              {
                var:         'pvcs',
                parsingFunc: (data) => {
                  return data.filter((pvc) => {
                    return pvc.namespace !== this.value?.metadata?.namespace;
                  });
                }
              },
            ]
          },
          [SECRET]: {
            applyTo: [
              { var: 'namespacedSecrets' },
              {
                var:         'imagePullNamespacedSecrets',
                parsingFunc: (data) => {
                  return data.filter((secret) => (secret._type === SECRET_TYPES.DOCKER || secret._type === SECRET_TYPES.DOCKER_JSON));
                }
              }
            ]
          },
          [NODE]: {
            applyTo: [
              { var: 'allNodeObjects' },
              {
                var:         'allNodes',
                parsingFunc: (data) => {
                  return data.filter((node) => {
                    if (!node.status?.conditions) {
                      return false;
                    }

                    for (const condition of node.status.conditions) {
                      if (condition.type === 'Ready') {
                        return condition.status === 'True';
                      }
                    }

                    return false;
                  }).map((node) => node.id);
                }
              }
            ]
          },
        }
      };
    },

    cancel() {
      this.done();
    },

    saveWorkload() {
      const container = this.container;

      if (container) {
        const containerResources = container.resources;
        const nvidiaGpuLimit = container.resources?.limits?.[NVIDIA.vGPU];

        if (!this.nvidiaIsValid(nvidiaGpuLimit)) {
          try {
            // delete containerResources.requests[NVIDIA.vGPU];
            delete containerResources.limits[NVIDIA.vGPU];

            if (Object.keys(containerResources.limits).length === 0) {
              delete containerResources.limits;
            }
            if (Object.keys(containerResources.requests).length === 0) {
              delete containerResources.requests;
            }
            if (Object.keys(containerResources).length === 0) {
              delete container.resources;
            }
          } catch {}
        } else {
          // Set default scheduler to volcano
          this.podTemplateSpec.schedulerName = VolcanoScheduler;
        }
      }

      const template = this.spec.template;
      const podTemplateSpec = this.podTemplateSpec;
      const nodeAffinity = podTemplateSpec.affinity?.nodeAffinity || {};

      this.fixNodeAffinity(nodeAffinity);

      // The fields are being removed because they are not allowed to be editabble
      if (this.mode === _EDIT) {
        if (podTemplateSpec.affinity && Object.keys(podTemplateSpec.affinity).length === 0) {
          delete podTemplateSpec.affinity;
        }

        // Removing `affinity` fixes the issue with setting the `imagePullSecrets`
        // However, this field should not be set. Therefore this is explicitly removed.
        if (podTemplateSpec.imagePullSecrets && podTemplateSpec.imagePullSecrets.length === 0) {
          delete podTemplateSpec.imagePullSecrets;
        }
      }

      // Handle the case where the user has changed the name of the workload
      // Only do this for clone. Not allowed for edit
      if (this.realMode === _CLONE) {
        if (template.metadata) {
          template.metadata.name = this.value.metadata?.name;
          template.metadata.description = this.value.metadata?.description;
        }
      }

      Object.assign(this.value, { spec: this.spec });
    },

    // node and pod affinity are formatted incorrectly from API; fix before saving
    fixNodeAffinity(nodeAffinity) {
      const preferredDuringSchedulingIgnoredDuringExecution =
        nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution || [];
      const requiredDuringSchedulingIgnoredDuringExecution =
        nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution || {};

      preferredDuringSchedulingIgnoredDuringExecution.forEach((term) => {
        const matchExpressions = term?.preference?.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });

      (
        requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms || []
      ).forEach((term) => {
        const matchExpressions = term.matchExpressions || [];

        matchExpressions.forEach((expression) => {
          if (expression.values) {
            expression.values =
              typeof expression.values === 'string' ? [expression.values] : [...expression.values];
          }
        });
      });
    },

    clearPvcFormState(hookName) {
      // On the `closePvcForm` event, remove the
      // before save hook to prevent the PVC from
      // being created. Use the PVC's unique ID to distinguish
      // between hooks for different PVCs.
      if (this[BEFORE_SAVE_HOOKS]) {
        this.unregisterBeforeSaveHook(hookName);
      }
    },

    nvidiaIsValid(nvidiaGpuLimit) {
      if ( !Number.isInteger(parseInt(nvidiaGpuLimit)) ) {
        return false;
      }
      if (nvidiaGpuLimit === undefined) {
        return false;
      }
      if (nvidiaGpuLimit < 1) {
        return false;
      } else {
        return true;
      }
    },
  },
};
