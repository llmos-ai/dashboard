<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import LLMOSWorkloadMixin from '@shell/mixins/llmos-workload';
import { MANAGEMENT, EVENT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:   'Notebook',
  mixins: [CreateEditView, FormValidation, LLMOSWorkloadMixin],
  props:  {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
  components: {},
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({
      events:   this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }),
      settings: this.$store.dispatch(`${ inStore }/findAll`, { type: MANAGEMENT.SETTING })
    });

    // don't block UI for these resources
    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const notebookType = this.value.metadata.labels['ml.llmos.ai/notebook-type'];

    return { notebookType };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    eventOverride() {
      const events = this.$store.getters[`cluster/all`](EVENT);

      return events.filter((event) => {
        if (event.involvedObject?.uid === this.value?.metadata?.uid ||
            event.involvedObject?.name.includes(`notebook-${ this.value.metadata?.name }`)) {
          return true;
        }
      }).map((event) => {
        return {
          reason:    (`${ event.reason || this.t('generic.unknown') }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message:   event.message || this.t('generic.unknown'),
          date:      event.lastTimestamp || event.firstTimestamp || event.metadata.creationTimestamp,
          eventType: event.eventType
        };
      });
    },

    notebookTypeOptions() {
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

    notebookImages() {
      const imagesString = this.$store.getters['management/all'](MANAGEMENT.SETTING).find((setting) => setting.id === 'default-notebook-images').default;
      let images = JSON.parse(imagesString);

      if (this.notebookType) {
        return images[this.notebookType].map((image) => {
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

      if (this.flatResources.requestsCpu === '' || this.flatResources.requestsMemory === '') {
        this.errors.push(this.t('validation.required', { key: 'CPU or Memory' }, true));
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }
    },

    setDefaultSvc() {
      if (this.value.spec.serviceType) {
        return;
      }

      if (this.notebookType === 'jupyter') {
        this.value.spec.serviceType = 'NodePort';
      } else {
        this.value.spec.serviceType = 'ClusterIP';
      }
    },

    resetImage() {
      if (this.notebookType !== this.value.labels['ml.llmos.ai/notebook-type']) {
        this.container.image = '';
      }
    },

    update() {
      this.setDefaultSvc();
      this.resetImage();

      if (this.notebookType) {
        const labels = {
          ...this.value.metadata.labels,
          'ml.llmos.ai/notebook-type': this.notebookType
        };

        this.value.setLabels(labels);
      }

      const _containers = [{
        ...this.container,
        name: this.value.metadata.name
      }];

      this.$set(this.value.spec.template.spec, 'containers', _containers);
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form
    v-else
    class="filled-height"
  >
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
        :event-override="eventOverride"
        :use-override-events="true"
        :mode="mode"
      >
        <Tab
          name="general"
          label="General"
          class="bordered-table"
          :weight="tabWeightMap.general"
        >
          <div class="row">
            <div class="col span-6 mb-10">
              <LabeledSelect
                v-model="notebookType"
                label="Type"
                :options="notebookTypeOptions"
                :disabled="!isCreate"
                required
                :mode="mode"
                @input="update"
              />
            </div>

            <div class="col span-6">
              <LabeledSelect
                v-model="container.image"
                label="Image"
                :options="notebookImages"
                required
                :mode="mode"
                @input="update"
              />
            </div>
          </div>

          <AdvancedSection
            class="col span-12 advanced"
            :mode="mode"
          >
            <div class="col span-6">
              <LabeledSelect
                v-model="spec.serviceType"
                :mode="mode"
                :options="svcOptions"
                :label="t('workload.networking.networkMode.label')"
                :placeholder="t('workload.networking.networkMode.placeholder')"
                @input="update"
              />
            </div>
          </AdvancedSection>
        </Tab>

        <Tab
          :label="t('workload.container.titles.resources')"
          name="resources"
          :weight="tabWeightMap['resources']"
        >
          <!-- Resources and Limitations -->
          <ContainerResourceLimit
            v-model="flatResources"
            :mode="mode"
            :runtime-classes="runtimeClasses"
            :pod-spec="podTemplateSpec"
            :show-tip="false"
          />
        </Tab>

        <Tab
          :label="t('generic.volume.title')"
          name="volumes"
          :weight="tabWeightMap['volumes']"
        >
          <Volume
            v-model="spec"
            :namespace="value.metadata.namespace"
            :register-before-hook="registerBeforeHook"
            :mode="mode"
            :save-pvc-hook-name="savePvcHookName"
            :loading="isLoadingSecondaryResources"
            :namespaced-pvcs="pvcs"
            @removePvcForm="clearPvcFormState"
          />
        </Tab>

        <Tab
          :label="t('workload.container.titles.nodeScheduling')"
          name="nodeScheduling"
          :weight="tabWeightMap['nodeScheduling']"
        >
          <NodeScheduling
            :mode="mode"
            :value="podTemplateSpec"
            :nodes="allNodes"
            :loading="isLoadingSecondaryResources"
          />
        </Tab>
      </ResourceTabs>
    </CruResource>
  </form>
</template>
