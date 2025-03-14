<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT, MANAGEMENT_GROUP, RBAC_GROUP } from '@shell/config/types';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { addObjects, isArray } from '@shell/utils/array';
import Loading from '@shell/components/Loading';
import { Checkbox } from '@components/Form/Checkbox';

/**
 * Display checkboxes for each global role, checked for given user or principal (group). Can save changes.
 */
export default {
  components: {
    Loading,
    Checkbox,
  },
  props: {
    mode: {
      type: String,
      default: _VIEW,
    },
    realMode: {
      type: String,
      default: _VIEW,
    },
    assignOnly: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'group',
      validator(val) {
        return val === 'group' || val === 'user';
      },
    },
    userId: {
      type: String,
      default: '',
    },
  },
  async fetch() {
    try {
      this.allRoles = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.GLOBAL_ROLE,
      });
      if (!this.sortedRoles) {
        this.sortedRoles = {
          global: [],
          builtin: [],
          custom: [],
        };

        this.allRoles.forEach((role) => {
          const roleType = this.getRoleType(role);

          if (roleType) {
            this.sortedRoles[roleType].push(role);
          }
        });

        const sort = (a, b) =>
          a.spec.displayName.localeCompare(b.spec.displayName);

        this.sortedRoles.builtin = this.sortedRoles.builtin.sort(sort);
        this.sortedRoles.custom = this.sortedRoles.custom.sort(sort);

        if (!this.isCreate) {
          this.roleTemplateBindings = await this.$store.dispatch(
            'management/findAll',
            { type: MANAGEMENT.ROLE_TEMPLATE_BINDING, opt: { force: true } }
          );
        }

        this.update();
      }
    } catch (e) {}
  },
  data() {
    return {
      globalPermissions: ['admin', 'user'],
      roleTemplateBindings: null,
      sortedRoles: null,
      selectedRoles: [],
      startingSelectedRoles: [],
      assignOnlyRoles: {},
      roleChanges: {},
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isCreate() {
      return this.realMode === _CREATE;
    },

    isUser() {
      return this.type === 'user';
    },
  },
  watch: {
    groupprincipalid(groupprincipalid, oldgroupprincipalid) {
      if (groupprincipalid === oldgroupprincipalid) {
        return;
      }
      this.update();
    },
  },
  methods: {
    getRoleType(role) {
      if (this.globalPermissions.find((p) => p === role.id)) {
        return 'global';
      } else if (role.spec.builtin) {
        return 'builtin';
      } else {
        return 'custom';
      }
    },
    getUnique(...ids) {
      return `${this.userId}-${ids.join('-')}`;
    },

    selectDefaults() {
      Object.values(this.sortedRoles).forEach((roles) => {
        roles.forEach((mappedRole) => {
          if (mappedRole.spec?.newUserDefault) {
            this.selectedRoles.push(mappedRole.id);
          }
        });
      });
    },

    update() {
      this.selectedRoles = [];
      this.startingSelectedRoles = [];
      this.assignOnlyRoles = {};
      if (this.isCreate) {
        // Start with the new user default for each role
        this.selectDefaults();
      } else {
        // Start with the user's roles
        if (!this.userId) {
          return;
        }

        const boundRoles = this.roleTemplateBindings.filter((rtb) => {
          return rtb.subjects[0].name === this.userId;
        });

        Object.values(this.sortedRoles).forEach((roles) => {
          roles.forEach((mappedRole) => {
            const boundRole = boundRoles.find(
              (boundRole) => boundRole.roleTemplateRef.name === mappedRole.id
            );

            if (!!boundRole) {
              this.selectedRoles.push(mappedRole.id);
              this.startingSelectedRoles.push({
                roleId: mappedRole.id,
                bindingId: boundRole.id,
              });
              // Checkboxes should be disabled, besides normal 'mode' ways, if we're only assigning and not removing existing roles
              this.assignOnlyRoles[mappedRole.id] = this.assignOnly;
            }
          });
        });

        if (this.assignOnly && !this.selectedRoles.length) {
          // If we're assigning roles to a group that has no existing roles start with the default roles selected
          this.selectDefaults();
        }
      }

      // Force an update to pump out the initial state
      this.checkboxChanged();
    },

    checkboxChanged() {
      const addRoles = this.selectedRoles.filter(
        (selected) =>
          !this.startingSelectedRoles.find(
            (startingRole) => startingRole.roleId === selected
          )
      );
      const removeBindings = this.startingSelectedRoles
        .filter(
          (startingRole) =>
            !this.selectedRoles.find(
              (selected) => selected === startingRole.roleId
            )
        )
        .map((startingRole) => startingRole.bindingId);

      this.roleChanges = {
        initialRoles: this.startingSelectedRoles,
        addRoles,
        removeBindings,
      };

      this.$emit(
        'hasChanges',
        !!this.roleChanges.addRoles.length ||
          !!this.roleChanges.removeBindings.length
      );
      this.$emit('canLogIn', this.confirmUserCanLogIn());
      this.$emit('changed', this.roleChanges);
    },

    async saveAddedRoles(userId) {
      const requestOptions = {
        type: MANAGEMENT.ROLE_TEMPLATE_BINDING,
        metadata: {
          generateName: `rtb-`,
          labels: { 'auth.management.llmos.ai/user-id': userId || this.userId },
        },
        roleTemplateRef: {
          apiGroup: MANAGEMENT_GROUP,
          kind: 'GlobalRole',
          name: '', // a placeholder of the role name
        },
        subjects: [
          {
            apiGroup: RBAC_GROUP,
            kind: 'User',
            name: userId || this.userId,
          },
        ],
      };

      const newBindings = await Promise.all(
        this.roleChanges.addRoles.map((role) =>
          this.$store.dispatch(`management/create`, {
            ...requestOptions,
            roleTemplateRef: {
              ...requestOptions.roleTemplateRef,
              name: role, // Pass roleName dynamically here
            },
          })
        )
      );

      // Save all changes (and ensure user isn't logged out if they don't have permissions to make a change)
      await Promise.all(
        newBindings.map((newBinding) =>
          newBinding.save({ redirectUnauthorized: false })
        )
      );
    },

    async saveRemovedRoles() {
      const existingBindings = await Promise.all(
        this.roleChanges.removeBindings.map((bindingId) =>
          this.$store.dispatch('management/find', {
            type: MANAGEMENT.ROLE_TEMPLATE_BINDING,
            id: bindingId,
          })
        )
      );

      // Save all changes (and ensure user isn't logged out if they don't have permissions to make a change)
      await Promise.all(
        existingBindings.map((existingBinding) =>
          existingBinding.remove({ redirectUnauthorized: false })
        )
      );
    },

    /**
     * userId is optional, used when a user has just been created
     */
    async save(userId) {
      // Ensure roles are added before removed (in case by removing one user is unable to add another)
      await this.saveAddedRoles(userId);
      await this.saveRemovedRoles();
      await this.$store.dispatch(
        'management/findAll',
        {
          type: MANAGEMENT.ROLE_TEMPLATE_BINDING,
          opt: { force: true },
        },
        { force: true }
      );
    },

    confirmUserCanLogIn() {
      const allRolesRules = [];

      Object.values(this.sortedRoles).forEach((roles) => {
        roles.forEach((mappedRole) => {
          if (this.selectedRoles.includes(mappedRole.id)) {
            addObjects(allRolesRules, mappedRole.rules || []);
          }
        });
      });

      return allRolesRules.some((rule) => this.isRuleValid(rule));
    },

    isRuleValid(rule) {
      // return true
      // Brought over from Ember

      if (
        (rule.resources || []).some(resourceValidator) &&
        (rule.apiGroups || []).some(apiGroupValidator) &&
        verbsValidator(rule.verbs || [])
      ) {
        return true;
      }

      return false;

      function resourceValidator(resource) {
        const resourcesRequiredForLogin = ['*', 'preferences', 'settings'];

        // console.log(`resourceValidator status: `, resourcesRequiredForLogin.includes(resource), resource);
        return resourcesRequiredForLogin.includes(resource);
      }

      function apiGroupValidator(apiGroup) {
        const apiGroupsRequiredForLogin = ['*', 'management.llmos.ai'];

        // console.log(`apiGroupsRequiredForLogin status: `, apiGroupsRequiredForLogin.includes(apiGroup), apiGroup);
        return apiGroupsRequiredForLogin.includes(apiGroup);
      }

      function verbsValidator(verbs) {
        const restrictedTarget = ['get', 'list', 'watch'];
        const verbsRequiredForLogin = ['*', ...restrictedTarget];

        if (isArray(verbs) && verbs.length > 1) {
          // console.log(`verbsRequiredForLogin status 1: `, restrictedTarget.every(rt => verbs.includes(rt)), verbs);
          return restrictedTarget.every((rt) => verbs.includes(rt));
        }

        // console.log(`verbsRequiredForLogin status 2: `, verbsRequiredForLogin.includes(verbs[0]), verbsRequiredForLogin, verbs);
        return verbsRequiredForLogin.includes(verbs[0]);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <form v-if="selectedRoles">
      <div
        v-for="(sortedRole, roleType) in sortedRoles"
        :key="roleType"
        class="role-group mb-10"
      >
        <a-card v-if="Object.keys(sortedRole).length" :show-actions="false">
          <template v-slot:title>
            <div class="type-title">
              <span>{{ t(`rbac.globalRoles.types.${roleType}.label`) }}</span>
              <div class="type-description">
                {{
                  t(`rbac.globalRoles.types.${roleType}.description`, {
                    isUser,
                  })
                }}
              </div>
            </div>
          </template>
          <div
            class="checkbox-section"
            :class="'checkbox-section--' + roleType"
          >
            <div
              v-for="(role, i) in sortedRoles[roleType]"
              :key="i"
              class="checkbox mb-10 mr-10"
            >
              <Checkbox
                v-model:value="selectedRoles"
                :value-when-true="role.id"
                :disabled="!!assignOnlyRoles[role.id]"
                :label="role.nameDisplay"
                :description="role.descriptionDisplay"
                :mode="mode"
                @update:value="checkboxChanged"
              >
                <template #label>
                  <div class="checkbox-label-slot">
                    <span class="checkbox-label">{{ role.nameDisplay }}</span>
                    <i
                      v-if="!!assignOnlyRoles[role.id]"
                      v-clean-tooltip="t('rbac.globalRoles.assignOnlyRole')"
                      class="checkbox-info icon icon-info icon-lg"
                    />
                  </div>
                </template>
              </Checkbox>
            </div>
          </div>
        </a-card>
      </div>
    </form>
  </div>
</template>
<style lang="scss">
.role-group {
  .card-container {
    margin: 0;
  }
}
</style>
<style lang="scss" scoped>
$detailSize: 11px;
.role-group {
  .type-title {
    .type-description {
      font-size: $detailSize;
    }
  }

  .checkbox-section {
    display: grid;

    grid-template-columns: repeat(3, 1fr);

    &--global {
      grid-template-columns: 100%;
    }

    .checkbox-label {
      &-slot {
        display: inline-flex;
        align-items: center;
      }
      color: var(--body-text);
      margin: 0;
    }
  }
}
</style>
