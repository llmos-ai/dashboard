<script>
import { USERNAME } from '@shell/config/cookies';
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import LocaleSelector from '@shell/components/LocaleSelector';
import BrandImage from '@shell/components/BrandImage';
import InfoBox from '@shell/components/InfoBox';
import CopyCode from '@shell/components/CopyCode';
import { Banner } from '@components/Banner';
import { LOCAL, LOGGED_OUT, TIMED_OUT, _FLAGGED } from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import Password from '@shell/components/form/Password';
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { LOGIN_ERRORS } from '@shell/store/auth';
import {
  getVendor,
  getProduct,
} from '@shell/config/private-label';
import {_ALL_IF_AUTHED} from "@shell/plugins/dashboard-store/actions";

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput, AsyncButton, Checkbox, BrandImage, Banner, InfoBox, CopyCode, Password, LocaleSelector
  },

  async asyncData({ route, redirect, store }) {
    return {
      vendor:             getVendor(),
      hasLocal:           true,
      showLocal:          true,
      firstLogin:         false,
      showLocaleSelector: true,
    };
  },

  data({ $cookies }) {
    const username = $cookies.get(USERNAME, { parseJSON: false }) || '';
    return {
      product: getProduct(),

      username,
      remember: !!username,
      password: '',

      timedOut:  this.$route.query[TIMED_OUT] === _FLAGGED,
      loggedOut: this.$route.query[LOGGED_OUT] === _FLAGGED,
      err:       this.$route.query.err,

      customLoginError:   {}
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    errorMessage() {
      if (this.err === LOGIN_ERRORS.CLIENT_UNAUTHORIZED) {
        return this.t('login.clientError');
      } else if (this.err === LOGIN_ERRORS.CLIENT || this.err === LOGIN_ERRORS.SERVER) {
        return this.t('login.error');
      }

      return this.err?.length ? this.t('login.specificError', { msg: this.err }) : '';
    },

    errorToDisplay() {
      if (this.customLoginError?.showMessage === 'true' && this.customLoginError?.message && this.errorMessage) {
        return `${ this.customLoginError.message } \n ${ this.errorMessage }`;
      }

      if (this.errorMessage) {
        return this.errorMessage;
      }

      return '';
    },

    hasLoginMessage() {
      return this.errorToDisplay || this.loggedOut || this.timedOut;
    }

  },

  async fetch() {
    const { value } = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.BANNERS });

    this.customLoginError = JSON.parse(value).loginError;
  },

  mounted() {
    this.username = this.firstLogin ? 'admin' : this.username;
    this.$nextTick(() => {
      this.focusSomething();
    });
  },

  methods: {
    displayName(provider) {
      return this.t(`model.authConfig.provider.${ provider }`);
    },

    toggleLocal() {
      this.showLocal = !this.showLocal;
      this.$router.applyQuery({ [LOCAL]: _FLAGGED });
      this.$nextTick(() => {
        this.focusSomething();
      });
    },

    focusSomething() {
      if ( !this.showLocal ) {
        // One of the provider components will handle it
        return;
      }

      let elem;

      if ( this.username ) {
        elem = this.$refs.password;
      } else {
        elem = this.$refs.username;
      }

      if ( elem?.focus ) {
        elem.focus();

        if ( elem.select ) {
          elem.select();
        }
      }
    },

    handleProviderError(err) {
      this.err = err;
    },

    async loginLocal(buttonCb) {
      try {
        await this.$store.dispatch('auth/login', {
          provider: 'local',
          body:     {
            username: this.username,
            password: this.password
          }
        });

        const user = await this.$store.dispatch('management/findAll', {
          type: MANAGEMENT.USER,
          opt:  { url: `/v1/${MANAGEMENT.USER}?me=true` }
        });

        if (!!user?.[0]) {
          this.$store.dispatch('auth/gotUser', user[0]);
        }

        if ( this.remember ) {
          this.$cookies.set(USERNAME, this.username, {
            encode:   (x) => x,
            maxAge:   86400 * 365,
            path:     '/',
            sameSite: true,
            secure:   true,
          });
        } else {
          this.$cookies.remove(USERNAME);
        }

        this.$router.replace('/');
      } catch (err) {
        this.err = err;
        this.timedOut = null;
        this.loggedOut = null;

        buttonCb(false);
      }
    },
  }
};
</script>

<template>
  <main class="main-layout login">
    <div class="row gutless mb-20">
      <div class="col span-12 p-20">
        <h1 class="text-center login-welcome">
          {{ t('login.welcome', {vendor: 'LLMOS Dashboard'}) }}
        </h1>
        <div
          class="login-messages"
          data-testid="login__messages"
          :class="{'login-messages--hasContent': hasLoginMessage}"
        >
          <Banner
            v-if="errorToDisplay"
            :label="errorToDisplay"
            color="error"
          />
          <h4
            v-else-if="loggedOut"
            class="text-success text-center"
          >
            {{ t('login.loggedOut') }}
          </h4>
          <h4
            v-else-if="timedOut"
            class="text-error text-center"
          >
            {{ t('login.loginAgain') }}
          </h4>
        </div>

        <template v-if="hasLocal">
          <form
            v-if="showLocal"
            :class="{'mt-30': !hasLoginMessage}"
          >
            <div class="span-6 offset-3">
              <div class="mb-20">
                <LabeledInput
                  v-if="!firstLogin"
                  id="username"
                  ref="username"
                  v-model.trim="username"
                  data-testid="local-login-username"
                  :label="t('login.username')"
                  autocomplete="username"
                />
              </div>
              <div class="">
                <Password
                  id="password"
                  ref="password"
                  v-model="password"
                  data-testid="local-login-password"
                  :label="t('login.password')"
                  autocomplete="password"
                />
              </div>
            </div>
            <div class="mt-20">
              <div class="col span-12 text-center">
                <AsyncButton
                  id="submit"
                  data-testid="login-submit"
                  type="submit"
                  :action-label="t('login.loginWithLocal')"
                  :waiting-label="t('login.loggingIn')"
                  :success-label="t('login.loggedIn')"
                  :error-label="t('asyncButton.default.error')"
                  @click="loginLocal"
                />
                <div
                  v-if="!firstLogin"
                  class="mt-20"
                >
                  <Checkbox
                    v-model="remember"
                    :label="t('login.remember.label')"
                    type="checkbox"
                  />
                </div>
              </div>
            </div>
          </form>
          <div
            v-if="hasLocal && !showLocal"
            class="mt-20 text-center"
          >
            <a
              id="login-useLocal"
              data-testid="login-useLocal"
              role="button"
              @click="toggleLocal"
            >
              {{ t('login.useLocal') }}
            </a>
          </div>
        </template>
        <div
          v-if="showLocaleSelector"
          class="locale-elector text-center"
        >
          <LocaleSelector mode="login" />
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  .login {
    overflow: hidden;
    margin: auto;
    width: 750px;

    .row {
      align-items: center;
    }

    .landscape {
      height: 100vh;
      margin: 0;
      object-fit: cover;
    }

    .login-welcome {
      margin: 0
    }

    .login-messages {
      display: flex;
      justify-content: center;
      align-items: center;

      .banner {
        margin: 5px;
      }
      h4 {
        margin: 0;
      }
      &--hasContent {
        min-height: 70px;
      }

      .text-error, .banner {
        max-width: 80%;
      }
    }

    .first-login-message {
      .banner {
        margin-bottom: 0;
        border-left: 0;

        ::v-deep code {
          font-size: 12px;
          padding: 0;
        }
      }
    }
  }

  .gutless {
    height: 100vh;
    & > .span-6 {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      height: 100%;
      place-content: center;
    }
  }
  .locale-elector {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0 auto;
  }
</style>
