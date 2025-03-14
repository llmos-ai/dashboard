<script>
import { mapGetters } from 'vuex';
import ChangePassword from '@shell/components/form/ChangePassword';
import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal.vue';

export default {
  components: {
    AsyncButton,
    ChangePassword,
    AppModal,
  },
  data() {
    return {
      valid: false,
      password: '',
      showModal: false,
    };
  },
  computed: { ...mapGetters({ t: 'i18n/t' }) },
  methods: {
    show(show) {
      if (show) {
        this.showModal = true;
      } else {
        this.showModal = false;
      }
    },
    async submit(buttonCb) {
      try {
        await this.$refs.changePassword.save();
        this.show(false);
        buttonCb(true);
      } catch (err) {
        buttonCb(false);
      }
    },
  },
};
</script>

<template>
  <app-modal
    v-if="showModal"
    custom-class="change-password-modal"
    data-testid="change-password__modal"
    name="password-modal"
    :width="500"
    :height="465"
    :trigger-focus-trap="true"
    @close="show(false)"
  >
    <a-card :title="t('changePassword.title')">
      <form @submit.prevent>
        <ChangePassword ref="changePassword" @valid="valid = $event" />
      </form>

      <template #actions>
        <!-- type reset is required by lastpass -->
        <a-button
          role="button"
          :aria-label="t('changePassword.cancel')"
          htmlType="reset"
          @click="show(false)"
        >
          {{ t('changePassword.cancel') }}
        </a-button>
        <!-- TODO: type=submit -->
        <AsyncButton
          type="primary"
          mode="apply"
          class="btn bg-error"
          :disabled="!valid"
          value="LOGIN"
          @click="submit"
        />
      </template>
    </a-card>
  </app-modal>
</template>
