<script>
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import UnitInput from '@shell/components/form/UnitInput';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { allHash } from '@shell/utils/promise';
import PersistentVolumeClaim from '@shell/components/PersistentVolumeClaim';
import InfoBox from '@shell/components/InfoBox';
import CreateEditView from '@shell/mixins/create-edit-view';
import { MANAGEMENT, CLUSTER } from '@shell/config/types';
import AdvancedSection from '@shell/components/AdvancedSection.vue';

export default {
  name: 'NotebookEdit',

  components: {
    AdvancedSection,
    Tab,
    UnitInput,
    CruResource,
    InfoBox,
    ResourceTabs,
    PersistentVolumeClaim,
    LabeledSelect,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    allHash({
      notebooks: this.$store.dispatch(`${ inStore }/findAll`, { type: CLUSTER.NOTEBOOK }),
      settings:  this.$store.dispatch(`${ inStore }/findAll`, { type: MANAGEMENT.SETTING })
    });
  },

  data() {
    const container = this.value.spec.template.spec.containers[0];
    const requests = container.resources?.requests || { cpu: '', memory: '' };
    const limits = container.resources?.limits || { cpu: '', memory: '' };
    const pvc = this.value.spec.volumes[0];

    const type = this.value.metadata.labels['ml.llmos.ai/notebook-type'];

    return {
      container,
      requests,
      limits,
      pvc,
      savePvcHookName: 'savePvcHook',
      type,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    typeOption() {
      return [{
        label: 'Jupyter Notebook',
        value: 'jupyter',
      }, {
        label: 'VisualStudio Code',
        value: 'code-server'
      }, {
        label: 'RStudio',
        value: 'rstudio'
      }];
    },

    images() {
      const imagesString = this.$store.getters['management/all'](MANAGEMENT.SETTING).find((setting) => setting.id === 'default-notebook-images').default;
      let images = JSON.parse(imagesString);

      if (this.type) {
        return images[this.type].map((image) => {
          return {
            label: image.containerImage,
            value: image.containerImage
          };
        });
      }

      images = Object.values(images).map((containerImages) => {
        const namespaceImage = containerImages.map((image) => {
          return {
            label: image.containerImage,
            value: image.containerImage
          };
        });

        return namespaceImage;
      });

      return images.flat();
    },
  },

  methods: {
    willSave() {
      this.errors = [];
      this.update();

      if (this.container.image === '') {
        this.errors.push(this.t('validation.required', { key: 'Image' }, true));
      }

      if (this.requests.cpu === '' || this.requests.memory === '') {
        this.errors.push(this.t('validation.required', { key: 'CPU or Memory' }, true));
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }
    },

    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    },

    setDefaultSvc() {
      if (this.type === 'jupyter') {
        this.value.spec.serviceType = 'NodePort';
      } else {
        delete this.value.spec.serviceType;
      }
    },

    resetImage() {
      if (this.type !== this.value.labels['ml.llmos.ai/notebook-type']) {
        this.container.image = '';
      }
    },

    update() {
      this.setDefaultSvc();
      this.resetImage();

      if (this.type) {
        const labels = {
          ...this.value.metadata.labels,
          'ml.llmos.ai/notebook-type': this.type
        };

        this.value.setLabels(labels);
      }

      // set resources
      this.$set(this.container.resources, 'requests', this.requests);

      if (this.container.resources?.limits === undefined ) {
        this.$set(this.container.resources, 'limits', {});
      }

      if (this.limits.cpu) {
        this.$set(this.container.resources?.limits, 'cpu', this.limits.cpu);
      } else {
        delete this.container.resources?.limits?.cpu;
      }
      if (this.limits.memory) {
        this.$set(this.container.resources?.limits, 'memory', this.limits.memory);
      } else {
        delete this.container.resources?.limits?.memory;
      }

      const _containers = [{
        ...this.container,
        name: this.value.metadata.name
      }];

      this.$set(this.value.spec.template.spec, 'containers', _containers);

      if (!this.pvc.name) {
        this.pvc.name = `nb-${ this.value.metadata.name }-${ this.value.metadata.namespace }`;
      }

      this.value.spec.template.spec.volumes[0].persistentVolumeClaim.claimName = this.pvc.name;

      const annotations = { ...this.value.metadata.annotations };

      this.value.setAnnotations(annotations);
    },
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="save"
  >
    <NameNsDescription
      :value="value"
      :namespaced="true"
      :mode="mode"
    />

    <ResourceTabs
      v-model="value"
      class="mt-15"
      :need-conditions="false"
      :need-related="false"
      :side-tabs="true"
      :mode="mode"
    >
      <Tab
        name="basic"
        label="Basics"
        :weight="3"
        class="bordered-table"
      >
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="type"
              label="Type"
              :options="typeOption"
              :disabled="!isCreate"
              required
              :mode="mode"
              class="mb-20"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledSelect
              v-model="container.image"
              label="Image"
              :options="images"
              required
              :mode="mode"
              class="mb-20"
              @input="update"
            />
          </div>
        </div>

        <div class="row">
          <div class="col span-6">
            <UnitInput
              v-model="requests.cpu"
              label="CPU"
              suffix="C"
              required
              :output-modifier="true"
              :mode="mode"
              class="mb-20"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <UnitInput
              v-model="requests.memory"
              label="Memory"
              :input-exponent="3"
              :output-modifier="true"
              :increment="1024"
              :mode="mode"
              suffix="Gi"
              required
              class="mb-20"
              @input="update"
            />
          </div>
        </div>
        <InfoBox>
          <PersistentVolumeClaim
            v-model="pvc"
            :mode="mode"
            :register-before-hook="registerBeforeHook"
            :save-pvc-hook-name="savePvcHookName"
            @removePvcForm="removePvcForm"
          />
        </InfoBox>

        <AdvancedSection
          class="col span-12 advanced"
          :mode="mode"
        >
          <div class="row">
            <div class="col span-6">
              <UnitInput
                v-model="limits.cpu"
                label="CPU Limit"
                suffix="C"
                :delay="0"
                positive
                :mode="mode"
                class="mb-20"
                @input="update"
              />
            </div>

            <div class="col span-6">
              <UnitInput
                v-model="limits.memory"
                label="Memory Limit"
                :input-exponent="3"
                :output-modifier="true"
                :increment="1024"
                :mode="mode"
                suffix="Gi"
                class="mb-20"
                @input="update"
              />
            </div>
          </div>
        </AdvancedSection>
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
