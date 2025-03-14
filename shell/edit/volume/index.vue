<script>
import ButtonDropdown from '@shell/components/ButtonDropdown';
import Mount from '@shell/edit/workload/storage/Mount';
import { _VIEW } from '@shell/config/query-params';
import CodeMirror from '@shell/components/CodeMirror';
import jsyaml from 'js-yaml';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { randomStr } from '@shell/utils/string';
import PersistentVolumeClaim from '@shell/edit/volume/persistentVolumeClaim/persistentvolumeclaim.vue';
import { PVC } from '@shell/config/types';

export default {
  name: 'Volume',

  components: {
    PersistentVolumeClaim,
    ArrayListGrouped,
    ButtonDropdown,
    Mount,
    CodeMirror
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    // pod spec
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    namespace: {
      type:    String,
      default: null,
    },

    savePvcHookName: {
      type:     String,
      required: true,
    },

    // namespaced configmaps and secrets
    namespacedPvcs: {
      type:    Array,
      default: () => [],
    },
    registerBeforeHook: {
      type:    Function,
      default: null,
    },
    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    this.initializeStorage();
    const volumes = this.value.template.spec.volumes;
    const templates = this.value.volumeClaimTemplates;
    const container = this.value.template.spec.containers[0];

    return {
      volumes,
      templates,
      container,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    /**
     * Generated list of volumes
     */
    volumeTypeOptions() {
      const excludedFiles = ['index'];
      const defaultVolumeTypes = [
        'addVolumeClaimTemplate',
        'persistentVolumeClaim',
      ];
      // Get all the custom volume types from the file names of this folder
      const customVolumeTypes = require
        .context('@shell/edit/volume', false, /^.*\.vue$/)
        .keys()
        .map((path) => path.replace(/(\.\/)|(.vue)/g, ''))
        .filter((file) => !excludedFiles.includes(file));

      return [
        ...customVolumeTypes,
        ...defaultVolumeTypes
      ]
        .sort()
        .map((volumeType) => ({
          label:  this.t(`volume.subtypes.${ volumeType }`),
          action: this.addVolume,
          value:  volumeType,
        }));
    },

    pvcNames() {
      return this.namespacedPvcs.map((pvc) => pvc.metadata.name);
    },
  },

  methods: {
    /**
     * Initialize missing values for the container
     */
    initializeStorage() {
      if (!this.value.template?.spec.volumes) {
        this.value['spec.template.spec.volumes'] = [];
      }

      if (!this.value.volumeClaimTemplates) {
        this.value['spec.volumeClaimTemplates'] = [];
      }
    },

    /**
     * Remove all mounts for given storage volume
     */
    removeVolume(volume) {
      const removeName = volume.row.value.name;

      this.volumes = this.volumes.filter(({ name }) => name !== removeName);
    },

    removeVolumeClaimTemplates(volume) {
      const removeName = volume.row.value.metadata?.name;

      this.container.volumeMounts = this.container.volumeMounts.filter(({ name }) => name !== removeName);
    },

    addVolume(type) {
      const name = `vol-${ randomStr(5).toLowerCase() }`;

      if (type === 'addVolumeClaimTemplate') {
        this.addPVC(name);
      } else if (type === 'createPVC') {
        this.volumes.push({
          _type:                 'createPVC',
          persistentVolumeClaim: {},
          name,
        });
      } else if (type === 'emptyDir') {
        this.volumes.push({
          _type:    type,
          emptyDir: { medium: '' },
          name,
        });
      } else {
        this.volumes.push({
          _type:  type,
          [type]: {},
          name,
        });
      }
    },

    volumeType(vol) {
      const type = Object.keys(vol).filter(
        (key) => typeof vol[key] === 'object'
      )[0];

      return type;
    },

    // import component for volume type
    getComponent(type) {
      switch (type) {
      case 'createPVC':
      case 'persistentVolumeClaim':
        return require(`@shell/edit/volume/persistentVolumeClaim/index.vue`)
          .default;
      case 'volumeClaimTemplates':
        return require(`@shell/edit/volume/persistentVolumeClaim/persistentvolumeclaim.vue`)
          .default;
      default: {
        let component;

        try {
          component = require(`@shell/edit/volume/${ type }.vue`).default;
        } catch {}

        return component;
      }
      }
    },

    headerFor(type) {
      if (
        this.$store.getters['i18n/exists'](`volume.subtypes.${ type }`)
      ) {
        return this.t(`volume.subtypes.${ type }`);
      } else {
        return type;
      }
    },

    yamlDisplay(volume) {
      try {
        return jsyaml.dump(volume);
      } catch {
        return volume;
      }
    },

    openPopover() {
      const button = this.$refs.buttonDropdown;

      try {
        button.togglePopover();
      } catch (e) {}
    },

    // codemirror needs to refresh if it is in a tab that wasn't visible on page load
    refresh() {
      if (this.$refs.cm) {
        this.$refs.cm.forEach((component) => component.refresh());
      }
    },

    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    },

    // volumeClaimTemplates methods
    updateTemplates() {
      this.value['volumeClaimTemplates'] = this.templates;
    },

    addPVC(name) {
      const namespace = this.namespace || this.$store.getters['defaultNamespace'];

      const data = { type: PVC };

      data.metadata = {
        name,
        namespace
      };

      this.$store.dispatch('cluster/create', data).then((pvc) => {
        pvc.applyDefaults();
        this.templates.push(pvc);
        this.updateTemplates();
      });
    },

    updatePVC(pvc) {
      const storage = pvc?.spec?.resources?.requests?.storage;

      if (storage) {
        if (!storage.toString().match(/[0-9]*[a-zA-Z]+$/)) {
          pvc.spec.resources.requests.storage += 'Gi';
        }
      }
      this.name = pvc?.metadata?.name;
      this.update();
    },

  },
};
</script>

<template>
  <div>
    <!-- Volume Claim Templates -->
    <ArrayListGrouped
      v-model:value="templates"
      class="mb-20"
      :can-add="false"
      @update:value="updateTemplates()"
      @remove="removeVolumeClaimTemplates"
    >
      <template #default="props">
        <div>
          <h3>{{ t('volume.volumeClaimTemplates.title') }}</h3>
          <PersistentVolumeClaim
            v-if="props.row.value.metadata"
            :value="props.row.value"
            :mode="mode"
            :container="container"
            :save-pvc-hook-name="savePvcHookName"
            @update:value="updatePVC(props.row.value)"
          />
        </div>
      </template>
    </ArrayListGrouped>

    <!-- Storage Volumes -->
    <ArrayListGrouped
      v-model:value="volumes"
      :mode="mode"
      :can-add="false"
      @remove="removeVolume"
    >
      <!-- Custom/default storage volume form -->
      <template #default="props">
        <h3>{{ headerFor(volumeType(props.row.value)) }}</h3>
        <div>
          <component
            :is="getComponent(volumeType(props.row.value))"
            v-if="getComponent(volumeType(props.row.value))"
            :value="props.row.value"
            :pod-spec="value"
            :mode="mode"
            :namespace="namespace"
            :container="container"
            :pvcs="pvcNames"
            :register-before-hook="registerBeforeHook"
            :save-pvc-hook-name="savePvcHookName"
            :loading="loading"
            @removePvcForm="removePvcForm"
          />
          <div v-else-if="isView">
            <CodeMirror
              ref="cm"
              :value="yamlDisplay(props.row.value)"
              :options="{ readOnly: true, cursorBlinkRate: -1 }"
            />
          </div>
        </div>
      </template>
    </ArrayListGrouped>

    <!-- Add Storage Volume -->
    <ButtonDropdown
      v-if="!isView"
      id="select-volume"
      :button-label="t('volume.add.label')"
      :dropdown-options="volumeTypeOptions"
      size="sm"
      @click-action="e=>addVolume(e.value)"
    />
  </div>
</template>

<style lang='scss' scoped>
.volume-source {
  padding: 20px;
  margin: 20px 0px 20px 0px;
  position: relative;

  :deep() .code-mirror {
    .CodeMirror {
      background-color: var(--yaml-editor-bg);
      & .CodeMirror-gutters {
        background-color: var(--yaml-editor-bg);
      }
    }
  }
}

.remove-vol {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0px;
}

.add-vol:focus {
  outline: none;
  box-shadow: none;
}
</style>
