<script>
import { randomStr } from '@shell/utils/string';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import AsyncButton from '@shell/components/AsyncButton';
import { LOGGED_OUT, SETUP } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import { Checkbox } from '@shell/components/form/Checkbox';
import { getVendor, getProduct, setVendor } from '@shell/config/private-label';
import { RadioGroup } from '@shell/components/form/Radio';
import { setSetting } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Password from '@shell/components/form/Password';
import { applyProducts } from '@shell/store/type-map';
import { waitFor } from '@shell/utils/async';
import FormValidation from '@shell/mixins/form-validation';
import isUrl from 'is-url';
import { isLocalhost } from '@shell/utils/validators/setting';

const calcIsFirstLogin = (store) => {
  const firstLoginSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);

  return firstLoginSetting?.value === 'true' || firstLoginSetting?.value === undefined;
};

const calcMustChangePassword = async(store) => {
  await store.dispatch('auth/getUser');

  const out = store.getters['auth/v3User']?.mustChangePassword;

  return out;
};

export default {
  mixins: [FormValidation],

  data() {
    return {
      passwordOptions: [
        { label: this.t('setup.useRandom'), value: true },
        { label: this.t('setup.useManual'), value: false }],
      fvFormRuleSets: [{
        path:       'serverUrl',
        rootObject: this,
        rules:      ['required', 'https', 'url', 'trailingForwardSlash']
      }],
      productName: '',
      vendor:      getVendor(),
      product:     getProduct(),
      step:        parseInt(this.$route.query.step, 10) || 1,

      useRandom:          true,
      haveCurrent:        false,
      username:           null,
      isFirstLogin:       false,
      mustChangePassword: true,
      current:            null,
      password:           randomStr(),
      confirm:            null,
      v3User:             null,
      serverUrl:          null,
      mcmEnabled:         null,
      eula:               false,
      principals:         null,
      errors:             []
    };
  },

  // async beforeCreate() {
  //   const isFirstLogin = calcIsFirstLogin(this.$store);
  //   const mustChangePassword = true;

  //   if (isFirstLogin) {
  //     // Always show setup if this is the first log in
  //     return;
  //   } else if (mustChangePassword) {
  //     // If the password needs changing and this isn't the first log in ensure we have the password
  //     if (!!this.$store.getters['auth/initialPass']) {
  //       // Got it... show setup
  //       return;
  //     }
  //     // Haven't got it... redirect to log in so we get it
  //     await this.$store.dispatch('auth/logout', null, { root: true });

  //     return this.$router.replace(`/auth/login?${ LOGGED_OUT }`);
  //   }
  // },

  components: {
    AsyncButton, LabeledInput, CopyToClipboard, Checkbox, RadioGroup, Password
  },

  async fetch() {
    const serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    let plSetting;

    try {
      plSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);
    } catch (e) {
      // Older versions used Norman API to get these
      // plSetting = await this.$store.dispatch('rancher/find', {
      //   type: NORMAN.SETTING,
      //   id:   SETTING.PL,
      //   opt:  { url: `/v3/settings/${ SETTING.PL }` }
      // });
    }

    if (plSetting.value?.length && plSetting.value !== getVendor()) {
      setVendor(plSetting.value);
    }

    const productName = plSetting.default;

    // const principals = await this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL, opt: { url: '/v3/principals' } });
    const principals = [];
    const me = findBy(principals, 'me', true);

    const current = this.$route.query[SETUP] || this.$store.getters['auth/initialPass'];
    const v3User = this.$store.getters['auth/v3User'] ?? {};

    // const mcmFeature = await this.$store.dispatch('management/find', {
    //   type: MANAGEMENT.FEATURE, id: 'multi-cluster-management', opt: { url: `/v1/${ MANAGEMENT.FEATURE }/multi-cluster-management` }
    // });

    // const mcmEnabled = (mcmFeature?.spec?.value || mcmFeature?.status?.default) && productName !== 'Harvester';

    let serverUrl;

    if (serverUrlSetting?.value) {
      serverUrl = serverUrlSetting.value;
    } else {
      serverUrl = window.location.origin;
    }

    const isFirstLogin = await calcIsFirstLogin(this.$store);

    // const mustChangePassword = await calcMustChangePassword(this.$store);

    this['productName'] = productName;
    this['haveCurrent'] = !!current;
    this['username'] = me?.loginName || 'admin';
    this['isFirstLogin'] = isFirstLogin;
    this['mustChangePassword'] = true;
    this['current'] = current;
    this['v3User'] = v3User;
    this['serverUrl'] = serverUrl;
    // this['mcmEnabled'] = mcmEnabled;
    this['principals'] = principals;
  },

  computed: {
    saveEnabled() {
      if ( !this.eula && this.isFirstLogin) {
        return false;
      }

      // if ( this.mustChangePassword ) {
      //   if ( !this.current ) {
      //     return false;
      //   }

      //   if ( !this.useRandom ) {
      //     if ( !this.password || this.password !== this.confirm ) {
      //       return false;
      //     }
      //   }
      // }

      if (!isUrl(this.serverUrl) || this.fvGetPathErrors(['serverUrl']).length > 0) {
        return false;
      }

      return true;
    },

    me() {
      const out = findBy(this.principals, 'me', true);

      return out;
    },

    showLocalhostWarning() {
      return isLocalhost(this.serverUrl);
    }
  },

  watch: {
    useRandom(neu) {
      if (neu) {
        this.password = randomStr();
      } else {
        this.password = '';
        this.$nextTick(() => {
          this.$refs.password.focus();
        });
      }
    }
  },

  methods: {
    async save(buttonCb) {
      const promises = [];

      try {
        await applyProducts(this.$store, this.$plugin);
        await this.$store.dispatch('loadManagement');

        // update user password first if changed
        if ( this.mustChangePassword && this.password === this.confirm) {
          const users = await this.$store.dispatch('management/findAll', {
            type: MANAGEMENT.USER,
            opt:  { url: `/v1/${ MANAGEMENT.USER }?me=true` }
          });
          const user = users?.[0];

          user.spec.password = this.password;
          await user.save();
        }

        promises.push(setSetting(this.$store, SETTING.FIRST_LOGIN, 'false'));

        if (this.isFirstLogin) {
          if ( this.serverUrl ) {
            promises.push( setSetting(this.$store, SETTING.SERVER_URL, this.serverUrl) );
          }
        }

        await Promise.all(promises);

        setTimeout(() => {
          buttonCb(true);
          this.done();
        }, 2000);
      } catch (err) {
        console.error(err) ; // eslint-disable-line no-console
        buttonCb(false);
        this.errors = exceptionToErrorsArray(err);
      }
    },

    done() {
      this.$router.replace('/');
    },

    onServerUrlChange(value) {
      this.serverUrl = value.trim();
    },
  },
};
</script>

<template>
  <form class="setup">
    <div class="row">
      <div>
        <h1 class="text-center">
          {{ t('setup.welcome', {product}) }}
        </h1>

        <template v-if="mustChangePassword">
          <p
            v-clean-html="t(isFirstLogin ? 'setup.setPassword' : 'setup.newUserSetPassword', { username }, true)"
            class="text-center mb-20 mt-20 setup-title"
          />
          <!-- For password managers... -->
          <input
            type="hidden"
            name="username"
            autocomplete="username"
            :value="username"
          >
          <div class="mb-20">
            <RadioGroup
              v-model:value="useRandom"
              data-testid="setup-password-mode"
              name="password-mode"
              :options="passwordOptions"
            />
          </div>
          <div class="mb-20">
            <LabeledInput
              v-if="useRandom"
              ref="password"
              v-model:value.trim="password"
              :type="useRandom ? 'text' : 'password'"
              :disabled="useRandom"
              data-testid="setup-password-random"
              label-key="setup.newPassword"
            >
              <template
                v-if="useRandom"
                #suffix
              >
                <div
                  class="addon"
                  style="padding: 0 0 0 12px;"
                >
                  <CopyToClipboard
                    :text="password"
                    class="btn-sm"
                  />
                </div>
              </template>
            </LabeledInput>
            <Password
              v-else
              ref="password"
              v-model:value.trim="password"
              :label="t('setup.newPassword')"
              data-testid="setup-password"
              :required="true"
            />
          </div>
          <Password
            v-show="!useRandom"
            v-model:value.trim="confirm"
            autocomplete="new-password"
            data-testid="setup-password-confirm"
            :label="t('setup.confirmPassword')"
            :required="true"
          />
        </template>

        <br>
        <template v-if="isFirstLogin">
          <p>
            <t
              k="setup.serverUrl.tip"
              :raw="true"
            />
          </p>
          <div class="mt-20">
            <LabeledInput
              v-model:value="serverUrl"
              :label="t('setup.serverUrl.label')"
              data-testid="setup-server-url"
            />
          </div>

          <div class="checkbox pt-10 eula">
            <Checkbox
              id="checkbox-eula"
              v-model:value="eula"
              data-testid="setup-agreement"
            >
              <template #label>
                <t
                  k="setup.eula"
                  :raw="true"
                  :name="productName"
                />
              </template>
            </Checkbox>
          </div>
        </template>
        <div
          id="submit"
          class="text-center mt-20"
        >
          <AsyncButton
            key="passwordSubmit"
            type="primary"
            mode="continue"
            :disabled="!saveEnabled"
            data-testid="setup-submit"
            @click="save"
          />
        </div>

        <div class="setup-errors mt-20">
          <h4
            v-for="err in errors"
            :key="err"
            class="text-error text-center"
          >
            {{ err }}
          </h4>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.setup {
  overflow: hidden;
  margin: auto;
  max-width: 500px;

  .row {
    & .checkbox {
      margin: auto
    }
  }
  .setup-errors {
    min-height: 50px;
  }

  p {
    line-height: 20px;
  }
}
</style>
