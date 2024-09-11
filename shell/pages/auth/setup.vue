<script>
import { randomStr } from '@shell/utils/string';
import { LabeledInput } from '@components/Form/LabeledInput';
import CopyToClipboard from '@shell/components/CopyToClipboard';
import AsyncButton from '@shell/components/AsyncButton';
import { MANAGEMENT } from '@shell/config/types';
import { Checkbox } from '@components/Form/Checkbox';
import { getVendor, getProduct, setVendor } from '@shell/config/private-label';
import { RadioGroup } from '@components/Form/Radio';
import { setSetting } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Password from '@shell/components/form/Password';
import { applyProducts } from '@shell/store/type-map';

export const calcIsFirstLogin = (store) => {
  const firstLoginSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);

  if (firstLoginSetting.value === undefined) {
    return true;
  }

  return firstLoginSetting.value === 'true';
};

export default {
  layout: 'unauthenticated',

  components: {
    AsyncButton, LabeledInput, CopyToClipboard, Checkbox, RadioGroup, Password
  },

  data() {
    return {
      passwordOptions: [
        { label: this.t('setup.useRandom'), value: true },
        { label: this.t('setup.useManual'), value: false }],
    };
  },

  async middleware({ store, redirect, route } ) {
    try {
      await store.dispatch('management/findAll', {
        type: MANAGEMENT.SETTING,
        opt:  {
          load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
        }
      });
    } catch (e) {
      return redirect('/');
    }

    const isFirstLogin = calcIsFirstLogin(store);

    if (isFirstLogin) {
      // Always show setup if this is the first log in
      return;
    }

    // For all other cases we don't need to show setup
    return redirect('/');
  },

  async asyncData({ route, req, store }) {
    const serverUrlSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);
    const plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);

    if (plSetting.value?.length && plSetting.value !== getVendor()) {
      setVendor(plSetting.value);
    }

    const productName = plSetting.default;
    let serverUrl;

    if (serverUrlSetting?.value) {
      serverUrl = serverUrlSetting.value;
    } else if ( process.server ) {
      serverUrl = req.headers.host;
    } else {
      serverUrl = window.location.origin;
    }

    const isFirstLogin = calcIsFirstLogin(store);
    const user = store.getters['auth/user'];

    return {
      vendor:             getVendor(),
      product:            getProduct(),
      step:               parseInt(route.query.step, 10) || 1,
      password:           randomStr(),
      confirm:            '',
      eula:               false,
      errors:             [],
      isFirstLogin,
      serverUrl,
      productName,
      mustChangePassword: true,
      useRandom:          true,
      user,
      username:           user?.spec.username || 'admin',
    };
  },

  computed: {
    saveEnabled() {
      if ( !this.eula && this.isFirstLogin) {
        return false;
      }

      if ( !this.useRandom ) {
        if ( !this.password || this.password !== this.confirm ) {
          return false;
        }
      }

      return true;
    },
  },

  watch: {
    useRandom(neu) {
      if (neu) {
        this.password = randomStr();
      } else {
        this.password = '';
        this.confirm = '';
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
              v-model="useRandom"
              data-testid="setup-password-mode"
              name="password-mode"
              :options="passwordOptions"
            />
          </div>
          <div class="mb-20">
            <LabeledInput
              v-if="useRandom"
              ref="password"
              v-model.trim="password"
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
              v-model.trim="password"
              :label="t('setup.newPassword')"
              data-testid="setup-password"
              :required="true"
            />
          </div>
          <Password
            v-show="!useRandom"
            v-model.trim="confirm"
            autocomplete="new-password"
            data-testid="setup-password-confirm"
            :label="t('setup.confirmPassword')"
            :required="true"
          />
        </template>

        <br>
        <template v-if="isFirstLogin">
          <template>
            <p>
              <t
                k="setup.serverUrl.tip"
                :raw="true"
              />
            </p>
            <div class="mt-20">
              <LabeledInput
                v-model="serverUrl"
                :label="t('setup.serverUrl.label')"
                data-testid="setup-server-url"
              />
            </div>
          </template>

          <div class="checkbox pt-10 eula">
            <Checkbox
              id="checkbox-eula"
              v-model="eula"
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
            type="submit"
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
