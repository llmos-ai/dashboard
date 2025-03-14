<script>
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT, MANAGEMENT_GROUP, RBAC_GROUP } from '@shell/config/types';

export default {
  emit: ['close'],
  components: {
    ProjectMemberEditor,
    AsyncButton,
    Banner,
  },

  props: {
    resources: {
      type: Array,
      required: true,
    },

    onAdd: {
      type: Function,
      default: () => {},
    },

    projectId: {
      type: String,
      default: null,
    },

    saveInModal: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      member: {
        permissionGroup: 'owner',
        custom: {},
        principalId: '',
        roleTemplateIds: [],
      },
      error: null,
    };
  },

  computed: {
    principal() {
      return this.$store.getters['auth/principalId'] || '';
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async apply() {
      this.onAdd(await this.createBindings());
      this.close();
    },

    async createBindings() {
      const promises = this.member.roleTemplateIds.map((roleTemplateId) =>
        this.$store.dispatch(`management/create`, {
          type: MANAGEMENT.ROLE_TEMPLATE_BINDING,
          namespaceId: this.projectId,
          roleTemplateRef: {
            apiGroup: MANAGEMENT_GROUP,
            kind: 'RoleTemplate',
            name: roleTemplateId,
          },
          subjects: [
            {
              apiGroup: RBAC_GROUP,
              kind: 'User',
              name: this.member.principalId,
            },
          ],
        })
      );

      return Promise.all(promises);
    },

    saveBindings(btnCB) {
      this.error = null;
      this.createBindings()
        .then((bindings) => {
          return Promise.all(bindings.map((b) => b.save()));
        })
        .then(() => {
          btnCB(true);
          setTimeout(this.close, 500);
        })
        .catch((err) => {
          this.error = err;
          btnCB(false);
        });
    },
  },
};
</script>

<template>
  <a-Card
    :title="t('addProjectMemberDialog.title')"
    :show-highlight-border="false"
    :sticky="true"
  >
    <div class="pl-10 pr-10">
      <Banner v-if="error" color="error">
        {{ error }}
      </Banner>
      <ProjectMemberEditor
        v-model:value="member"
        :use-two-columns-for-custom="true"
      />
    </div>

    <template #actions>
      <a-button class="mr-10" @click="close">
        {{ t('generic.cancel') }}
      </a-button>

      <AsyncButton
        v-if="saveInModal"
        mode="create"
        @click="(cb) => saveBindings(cb)"
      />

      <a-button v-else type="primary" @click="apply">
        {{ t('generic.add') }}
      </a-button>
    </template>
  </a-Card>
</template>
