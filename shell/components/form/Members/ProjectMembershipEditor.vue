<script>
import { MANAGEMENT, MANAGEMENT_GROUP, RBAC_GROUP } from "@shell/config/types";
import { _CREATE, _VIEW } from "@shell/config/query-params";
import MembershipEditor, {
  canViewMembershipEditor,
} from "@shell/components/form/Members/MembershipEditor";

export function canViewProjectMembershipEditor(store) {
  return canViewMembershipEditor(store, true);
}

export default {
  components: { MembershipEditor },

  props: {
    parentId: {
      type: String,
      default: null,
    },

    mode: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      MANAGEMENT,
      bindings: [],
      lastSavedBindings: [],
    };
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isView() {
      return this.mode === _VIEW;
    },

    principalId() {
      return this.$store.getters["auth/principalId"];
    },
  },

  methods: {
    defaultBindingHandler() {
      return this.$store.dispatch(`management/create`, {
        type: MANAGEMENT.ROLE_TEMPLATE_BINDING,
        roleTemplateRef: {
          apiGroup: MANAGEMENT_GROUP,
          kind: "RoleTemplate",
          name: "namespace-owner",
        },
        subjects: [
          {
            apiGroup: RBAC_GROUP,
            kind: "User",
            name: this.principalId,
          },
        ],
      });
    },
  },
};
</script>
<template>
  <MembershipEditor
    ref="editor"
    add-member-dialog-name="AddProjectMemberDialog"
    :modal-sticky="true"
    :default-binding-handler="defaultBindingHandler"
    :type="MANAGEMENT.ROLE_TEMPLATE_BINDING"
    :mode="mode"
    parent-key="namespaceId"
    :parent-id="parentId"
  />
</template>
