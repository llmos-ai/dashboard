<script>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import CreateEditView from '@shell/mixins/create-edit-view';
import { CONTAINER_DEFAULT_RESOURCE_LIMIT } from '@shell/config/labels-annotations';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import CruResource from '@shell/components/CruResource';
import { _VIEW, FLAT_VIEW, _CREATE } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import { K8S_TYPES } from '@shell/components/form/ResourceQuota/shared';
import Labels from '@shell/components/form/Labels';
import { randomStr } from '@shell/utils/string';

export default {
  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    Tab,
    ResourceTabs,
  },

  mixins: [CreateEditView],

  async fetch() {
  },

  data() {
    let originalQuotaId = null;

    if ( this.liveValue?.metadata?.name ) {
      originalQuotaId = `${ this.liveValue.metadata.name }/default-quota`;
    }

    return {
      originalQuotaId,
      viewMode:                _VIEW,
      containerResourceLimits: this.value.annotations?.[CONTAINER_DEFAULT_RESOURCE_LIMIT],
      rerenderNums:            randomStr(4),
      K8S_TYPES,
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    doneLocationOverride() {
      return this.value.listLocation;
    },

    flatView() {
      return (this.$route.query[FLAT_VIEW] || false);
    },

    showPodSecurityAdmission() {
      return false;
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneLocationOverride.name"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    :apply-hooks="applyHooks"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-if="!isView"
      :value="value"
      :namespaced="false"
      :mode="mode"
    />
    <ResourceTabs
      v-model="value"
      :mode="mode"
      :side-tabs="true"
    >
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
      >
        <Labels
          :key="rerenderNums"
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
      <Tab
        v-if="showPodSecurityAdmission"
        name="pod-security-admission"
        label-key="podSecurityAdmission.name"
        :label="t('podSecurityAdmission.name')"
      >
        <PodSecurityAdmission
          :labels="value.labels"
          :mode="mode"
          labels-prefix="pod-security.kubernetes.io/"
          @updateLabels="PSAChanged"
        />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>
