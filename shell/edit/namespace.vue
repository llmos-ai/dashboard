<script>
import NameNsDescription from '@shell/components/form/NameNsDescription';
import FormValidation from '@shell/mixins/form-validation';
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import CruResource from '@shell/components/CruResource';
import { _VIEW, FLAT_VIEW, _CREATE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import { K8S_TYPES } from '@shell/components/form/ResourceQuota/shared';
import Labels from '@shell/components/form/Labels';
import { randomStr } from '@shell/utils/string';
import ProjectMembershipEditor, { canViewProjectMembershipEditor } from '@shell/components/form/Members/ProjectMembershipEditor';
import { Banner } from '@shell/components/Banner';
import { MANAGEMENT } from '@shell/config/types';

export default {
  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    ProjectMembershipEditor,
    Tab,
    ResourceTabs,
    Banner,
  },

  mixins: [CreateEditView, FormValidation],
  async fetch() {},
  data() {
    let originalQuotaId = null;

    if (this.liveValue?.metadata?.name) {
      originalQuotaId = `${ this.liveValue.metadata.name }/default-quota`;
    }

    return {
      originalQuotaId,
      viewMode:           _VIEW,
      rerenderNums:       randomStr(4),
      membershipUpdate:   {},
      resource:           MANAGEMENT.ROLE_TEMPLATE_BINDING,
      saveBindings:       null,
      membershipHasOwner: false,
      K8S_TYPES,
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    canViewMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },

    canEditProject() {
      return this.value?.links?.update;
    },

    doneLocationOverride() {
      return this.value.listLocation;
    },

    flatView() {
      return this.$route.query[FLAT_VIEW] || false;
    },

    showPodSecurityAdmission() {
      return false;
    },

    showBannerForOnlyManagingMembers() {
      return this.mode === _EDIT && !this.canEditProject;
    },
  },

  methods: {
    async save(saveCb) {
      try {
        if (this.mode === _CREATE) {
          const savedProject = await this.value.save();

          if (this.membershipUpdate.save) {
            await this.membershipUpdate.save(savedProject.id);
          }
        } else if (this.mode === _EDIT) {
          if (this.canEditProject) {
            await this.value.save();

            // we allow users with permissions for roletemplatebindings to be able to manage members on projects
            if (this.membershipUpdate.save) {
              await this.membershipUpdate.save(this.value.id);
            }
          }
        }
        saveCb(true);
        this.$router.replace(this.value.listLocation);
      } catch (ex) {
        this.errors.push(ex);
        saveCb(false);
      }
    },

    onHasOwnerChanged(hasOwner) {
      this['membershipHasOwner'] = hasOwner;
    },

    onMembershipUpdate(update) {
      this['membershipUpdate'] = update;
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
    @error="(e) => (errors = e)"
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
      v-model:value="value"
      :mode="mode"
      :side-tabs="true"
    >
      <Tab
        v-if="canViewMembers"
        name="members"
        :label="t('project.members.label')"
        :weight="10"
      >
        <Banner
          v-if="showBannerForOnlyManagingMembers"
          color="info"
          :label="t('project.membersEditOnly')"
        />
        <ProjectMembershipEditor
          :mode="mode"
          :parent-id="value.id"
          @has-owner-changed="onHasOwnerChanged"
          @membership-update="onMembershipUpdate"
        />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
      >
        <Labels
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
