<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import DOMPurify from 'dompurify';

export default {
  components: {
    Checkbox,
    Loading,
    RadioGroup,
    SelectPrincipal,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    useTwoColumnsForCustom: {
      type:    Boolean,
      default: false,
    },
  },
  async fetch() {
    const [, roleTemplates] = await Promise.all([
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER }),
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE }),
    ]);

    this.roleTemplates = roleTemplates;
  },
  data() {
    this.setRoleTemplateIds(this.value.permissionGroup);

    return {
      customPermissions: [],
      roleTemplates:     [],
    };
  },
  computed: {
    customRoles() {
      return this.roleTemplates.filter((role) => {
        return !role.spec.builtin && !role.spec.locked;
      });
    },

    options() {
      return [
        {
          label:       this.t('projectMembers.projectPermissions.owner.label'),
          description: this.t(
            'projectMembers.projectPermissions.owner.description'
          ),
          value: 'owner',
        },
        {
          label:       this.t('projectMembers.projectPermissions.readOnly.label'),
          description: this.t(
            'projectMembers.projectPermissions.readOnly.description'
          ),
          value: 'read-only',
        },
        {
          label:       this.t('projectMembers.projectPermissions.custom.label'),
          description: this.t(
            'projectMembers.projectPermissions.custom.description'
          ),
          value: 'custom',
        },
      ];
    },

    customPermissionsUpdate() {
      this.customPermissions = this.customRoles.map((role) => ({
        description: this.purifyOption(
          role.description ||
            role.metadata?.annotations?.[DESCRIPTION] ||
            this.t('projectMembers.projectPermissions.noDescription')
        ),
        key:   this.purifyOption(role.id),
        label: this.purifyOption(role.id),
        value: false,
      }));

      return this.customPermissions;
    },
  },
  watch: {
    'value.permissionGroup'(newPermissionGroup) {
      this.setRoleTemplateIds(newPermissionGroup);
    },

    customPermissions: {
      deep: true,
      handler() {
        this.setRoleTemplateIds(this.value.permissionGroup);
      },
    },
  },
  methods: {
    onAdd(principalId) {
      this.value['principalId'] = principalId;
    },

    setRoleTemplateIds(permissionGroup) {
      const roleTemplateIds = this.getRoleTemplateIds(permissionGroup);

      this.value['roleTemplateIds'] = roleTemplateIds;
    },

    getRoleTemplateIds(permissionGroup) {
      if (permissionGroup === 'owner') {
        return ['namespace-owner'];
      }

      if (permissionGroup === 'read-only') {
        return ['namespace-readonly'];
      }

      if (permissionGroup === 'custom') {
        return this.customRoles
          .filter((permission) => permission.value)
          .map((permission) => permission.key);
      }

      return [permissionGroup];
    },
    purifyOption(option) {
      return DOMPurify.sanitize(option, { ALLOWED_TAGS: ['span'] });
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal
          project
          class="mb-20"
          :mode="mode"
          :retain-selection="true"
          @add="onAdd"
        />
      </div>
    </div>
    <a-card
      class="m-0"
      :show-actions="false"
    >
      <template v-slot:title>
        <div class="type-title">
          <h3>{{ t('projectMembers.projectPermissions.label') }}</h3>
          <div class="type-description">
            {{ t('projectMembers.projectPermissions.description') }}
          </div>
        </div>
      </template>
      <RadioGroup
        v-model:value="value.permissionGroup"
        :options="options"
        name="permission-group"
      />
      <div
        v-if="value.permissionGroup === 'custom'"
        class="custom-permissions ml-20 mt-10"
        :class="{ 'two-column': useTwoColumnsForCustom }"
      >
        <div v-if="customRoles.length > 0">
          <div
            v-for="(permission, i) in customPermissionsUpdate"
            :key="i"
          >
            <Checkbox
              v-model:value="permission.value"
              :disabled="permission.locked"
              class="mb-5"
              :label="permission.label"
            />
            <i
              v-if="permission.locked"
              v-clean-tooltip="permission.tooltip"
              class="icon icon-lock icon-fw"
            />
          </div>
        </div>
        <div v-else>
          <small>{{
            t('projectMembers.projectPermissions.noCustomRoles')
          }}</small>
        </div>
      </div>
    </a-card>
  </div>
</template>
<style lang="scss" scoped>
$detailSize: 11px;

:deep() .type-description {
  font-size: $detailSize;
}

label.radio {
  font-size: 16px;
}

.custom-permissions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  &.two-column {
    grid-template-columns: 1fr 1fr;
  }

  :deep() .checkbox-label {
    margin-right: 0;
  }
}
</style>
