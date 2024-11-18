<script>
import { Card } from '@components/Card';
import ProjectMemberEditor from '@shell/components/form/ProjectMemberEditor.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT, MANAGEMENT_GROUP, RBAC_GROUP } from '@shell/config/types';

export default {
  components: {
    Card,
    ProjectMemberEditor,
    AsyncButton,
    Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    },

    onAdd: {
      type:    Function,
      default: () => {}
    },

    projectId: {
      type:    String,
      default: null
    },

    saveInModal: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      member: {
        permissionGroup: 'owner',
        custom:          {},
        principalId:     '',
        roleTemplateIds: []
      },
      error: null
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
      const promises = this.member.roleTemplateIds.map((roleTemplateId) => this.$store.dispatch(`management/create`, {
        type:            MANAGEMENT.ROLE_TEMPLATE_BINDING,
        namespaceId:     this.projectId,
        roleTemplateRef: {
          apiGroup: MANAGEMENT_GROUP,
          kind:     'RoleTemplate',
          name:     roleTemplateId,
        },
        subjects: [
          {
            apiGroup: RBAC_GROUP,
            kind:     'User',
            name:     this.member.principalId,
          }
        ],
      }));

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
    }
  }
};
</script>

<template>
  <Card
    class="prompt-rotate"
    :show-highlight-border="false"
    :sticky="true"
  >
    <h4
      slot="title"
      v-clean-html="t('addNamespaceMemberDialog.title')"
      class="text-default-text"
    />

    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <Banner
        v-if="error"
        color="error"
      >
        {{ error }}
      </Banner>
      <ProjectMemberEditor
        v-model="member"
        :use-two-columns-for-custom="true"
      />
    </div>

    <div
      slot="actions"
      class="buttons"
    >
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>

      <AsyncButton
        v-if="saveInModal"
        mode="create"
        @click="cb=>saveBindings(cb)"
      />

      <button
        v-else
        class="btn role-primary"
        @click="apply"
      >
        {{ t('generic.add') }}
      </button>
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-rotate {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>

<style lang="scss">
  .card-container {
    border: 1px solid var(--border);
    box-shadow: none;
  }
</style>
