<script>
import { MANAGEMENT } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import ChangePassword from '@shell/components/form/ChangePassword';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import CruResource from '@shell/components/CruResource';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import Loading from '@shell/components/Loading';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import { Checkbox } from '@shell/components/form/Checkbox';

export default {
  components: {
    ChangePassword,
    CruResource,
    GlobalRoleBindings,
    Loading,
    LabeledInput,
    Checkbox,
  },
  mixins: [CreateEditView],

  data() {
    const showGlobalRoles = !!this.$store.getters[`management/schemaFor`](
      MANAGEMENT.GLOBAL_ROLE
    );

    const active = this.value.spec?.active || true;

    return {
      showGlobalRoles,
      form: {
        username:    this.value.spec?.username,
        description: this.value.spec?.description,
        displayName: this.value.spec?.displayName,
        active,
        password:    {
          password:          '',
          userChangeOnLogin: false,
        },
      },
      validation: {
        password:     false,
        roles:        !showGlobalRoles,
        rolesChanged: false,
      },
      roles: [],
    };
  },

  computed: {
    valid() {
      const valid = this.credentialsValid && this.rolesValid;

      if (this.isCreate) {
        return valid;
      }
      if (this.isEdit) {
        return (
          valid && (this.credentialsChanged || this.validation.rolesChanged)
        );
      }

      return false;
    },
    credentialsValid() {
      if (this.isCreate) {
        // Username must be supplied, password valid
        return !!this.form.username && this.validation.password;
      }
      if (this.isEdit) {
        // Password must be valid (though password field doesn't have to exist)
        return this.validation.password;
      }

      return false;
    },
    credentialsChanged() {
      if (this.isCreate) {
        return true; // Covered by valid
      }
      if (this.isEdit) {
        return (
          !!this.form.password.password ||
          this.form.description !== this.value.spec.description ||
          this.form.displayName !== this.value.spec.displayName ||
          this.form.password.userChangeOnLogin !== this.value.mustChangePassword
        );
      }

      return false;
    },
    rolesValid() {
      return this.validation.roles;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.name) {
        this.$refs.name.focus();
      }
    });
  },
  methods: {
    async save(buttonDone) {
      this.errors = [];
      try {
        if (this.isCreate) {
          const user = await this.createUser();

          await this.updateRoles(user.id);
        } else {
          await this.editUser();
          await this.updateRoles();
        }

        this.$router.replace({ name: this.doneRoute });
        buttonDone(true);
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },

    async createUser() {
      // Ensure username is unique (this does not happen in the backend)
      const users = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });

      if (users.find((u) => u.spec.username === this.form.username)) {
        throw new Error(this.t('user.edit.credentials.username.exists'));
      }

      const user = await this.$store.dispatch('management/create', {
        type:     MANAGEMENT.USER,
        metadata: { generateName: 'user-' },
        spec:     {
          username:    this.form.username,
          password:    this.form.password.password,
          displayName: this.form.displayName,
          active:      this.form.active,
          description: this.form.description,
        },
      });

      return await user.save();
    },

    async editUser() {
      if (!this.credentialsChanged) {
        return;
      }

      const user = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.USER,
        id:   this.value.id,
      });

      // Save change of password
      // - Password must be changed before editing mustChangePassword (setpassword action sets this to false)
      if (this.form.password.password) {
        user.spec.password = this.form.password.password;
      }

      // Save user updates
      user.spec.description = this.form.description;
      user.spec.displayName = this.form.displayName;
      await user.save();

      return await this.$store.dispatch('management/find', {
        type: MANAGEMENT.USER,
        id:   this.value.id,
        opt:  { force: true },
      });
    },

    async updateRoles(userId) {
      if (this.$refs.grb) {
        await this.$refs.grb.save(userId);
      }
    },
  },
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :validation-passed="valid"
    :errors="errors"
    :can-yaml="false"
    class="create-edit"
    @finish="save"
  >
    <div class="credentials">
      <h2>{{ t('user.edit.credentials.label') }}</h2>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            ref="name"
            v-model:value="form.username"
            label-key="user.edit.credentials.username.label"
            placeholder-key="user.edit.credentials.username.placeholder"
            :required="isCreate"
            :readonly="isEdit"
            :disabled="isView || isEdit"
            :ignore-password-managers="!isCreate"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="form.displayName"
            label-key="user.edit.credentials.displayName.label"
            placeholder-key="user.edit.credentials.displayName.placeholder"
            :disabled="isView"
          />
        </div>
      </div>
      <div class="row mt-20 mb-10">
        <div class="col span-8">
          <LabeledInput
            v-model:value="form.description"
            label-key="user.edit.credentials.userDescription.label"
            placeholder-key="user.edit.credentials.userDescription.placeholder"
            :disabled="isView"
          />
        </div>
      </div>

      <div class="row">
        <div class="col span-6">
          <Checkbox
            v-model:value="form.active"
            :mode="mode"
            :label="t('user.edit.isActive')"
          />
        </div>
      </div>

      <ChangePassword
        v-if="!isView"
        ref="changePassword"
        v-model:value="form.password"
        :mode="mode"
        :must-change-password="value.mustChangePassword"
        @valid="validation.password = $event"
      />

      <div
        v-if="showGlobalRoles"
        class="global-permissions"
      >
        <GlobalRoleBindings
          ref="grb"
          :user-id="value.id || liveValue.id"
          :mode="mode"
          :real-mode="realMode"
          type="user"
          @hasChanges="validation.rolesChanged = $event"
          @canLogIn="validation.roles = $event"
        />
      </div>
    </div>
  </CruResource>
</template>
