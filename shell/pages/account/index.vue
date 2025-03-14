<script>
import BackLink from '@shell/components/BackLink';
import PromptChangePassword from '@shell/components/PromptChangePassword';
import ResourceTable from '@shell/components/ResourceTable';
import CopyToClipboardText from '@shell/components/CopyToClipboardText';
import Loading from '@shell/components/Loading';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import BackRoute from '@shell/mixins/back-link';
import { Banner } from '@components/Banner';
import { _MULTI } from '@shell/plugins/dashboard-store/actions';
import { mapGetters } from 'vuex';
import Principal from '@shell/components/auth/Principal.vue';
import { AGE, STATE } from '@shell/config/table-headers';

const API_ENDPOINT = '/v1';

export default {
  layout: 'plain',
  components: {
    CopyToClipboardText,
    BackLink,
    Banner,
    PromptChangePassword,
    Loading,
    ResourceTable,
    Principal,
  },
  mixins: [BackRoute],
  async fetch() {
    this.canChangePassword = await this.calcCanChangePassword();

    if (this.apiKeySchema) {
      this.rows = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.TOKEN,
      });
    }

    // Get server url setting
    const serverUrlSetting = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id: SETTING.SERVER_URL,
    });

    this.serverUrlSetting = serverUrlSetting?.value;
  },

  data() {
    const principalId = this.$store.getters['auth/principalId'];

    return {
      serverUrlSetting: null,
      rows: [],
      canChangePassword: false,
      principalId,
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    apiKeys() {
      // Filter out tokens that are not API Keys and are not expired UI Sessions
      const isApiKey = (key) => {
        const labels = key.labels;
        const expired = key.status?.isExpired;
        const current =
          key.labels['auth.management.llmos.ai/is-current'] === 'true';

        return (!expired || !labels) && !current;
      };

      return !this.rows ? [] : this.rows.filter(isApiKey);
    },

    apiKeyheaders() {
      const NAME = {
        name: 'name',
        label: 'Access Key',
        value: 'name',
      };
      const DESCRIPTION = {
        name: 'description',
        label: 'Description',
        value: 'description',
      };

      const EXPIRES = {
        name: 'expires',
        label: 'Expires',
        value: 'expiresAt',
        formatter: 'LiveDate',
      };

      const headers = [STATE, NAME, DESCRIPTION, EXPIRES, AGE];

      return headers;
    },

    apiUrlBase() {
      let url = this.serverUrlSetting;

      // If the URL is relative, add on the current base URL from the browser
      if (url.indexOf('http') !== 0) {
        url = `${window.location.origin}/${url.replace(/^\/+/, '')}`;
      }

      // URL must end in a single slash
      url = `${url.replace(/\/+$/, '')}/`;

      return url;
    },

    apiUrl() {
      const base = this.apiUrlBase;
      const path = API_ENDPOINT.replace(/^\/+/, '');

      return `${base}${path}`;
    },

    apiKeySchema() {
      try {
        return this.$store.getters[`management/schemaFor`](MANAGEMENT.TOKEN);
      } catch (e) {}

      return null;
    },

    loggedInUser() {
      const user = this.$store.getters['auth/user'];

      return user.id;
    },

    principal() {
      const principalId = this.$store.getters['auth/principalId'];
      const principal = this.$store.getters['management/byId'](
        MANAGEMENT.USER,
        principalId
      );

      if (!principal) {
        console.error('Failed to find principal with id: ', principalId); // eslint-disable-line no-console
      }

      return principal || {};
    },
  },

  methods: {
    addKey() {
      this.$router.push({ path: 'account/create-key' });
    },

    async calcCanChangePassword() {
      if (!this.$store.getters['auth/enabled']) {
        return false;
      }

      if (this.principal.provider === 'local') {
        return this.principal.status.isActive;
      }

      const users = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.USER,
        opt: {
          url: `/v1/${MANAGEMENT.USER}?me=true`,
          load: _MULTI,
        },
      });

      if (users && users.length === 1) {
        return users[0].status.isActive;
      }

      return false;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <BackLink :link="backLink" />
    <h1 v-t="'accountAndKeys.title'" />

    <h2 v-t="'accountAndKeys.account.title'" />
    <div class="account">
      <Principal :value="loggedInUser" :use-muted="false" :show-labels="true" />
      <div>
        <a-button
          v-if="canChangePassword"
          type="primary"
          data-testid="account_change_password"
          @click="$refs.promptChangePassword.show(true)"
        >
          {{ t('accountAndKeys.account.change') }}
        </a-button>
      </div>
    </div>
    <PromptChangePassword ref="promptChangePassword" />

    <hr />
    <div class="keys-header">
      <div>
        <h2 v-t="'accountAndKeys.apiKeys.title'" />
        <div class="api-url">
          <span>{{ t('accountAndKeys.apiKeys.apiEndpoint') }}</span>
          <CopyToClipboardText :text="apiUrl" />
        </div>
      </div>
      <a-button
        v-if="apiKeySchema"
        type="primary"
        data-testid="account_create_api_keys"
        @click="addKey"
      >
        {{ t('accountAndKeys.apiKeys.add.label') }}
      </a-button>
    </div>
    <div v-if="apiKeySchema" class="keys">
      <ResourceTable
        :schema="apiKeySchema"
        :rows="apiKeys"
        :headers="apiKeyheaders"
        key-field="id"
        data-testid="api_keys_list"
        :search="true"
        :row-actions="true"
        :table-actions="true"
      />
    </div>
    <div v-else>
      <Banner color="warning" :label="t('accountAndKeys.apiKeys.notAllowed')" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
hr {
  margin: 20px 0;
}

.account {
  display: flex;
  justify-content: space-between;
}

.keys-header {
  display: flex;
  div {
    flex: 1;
  }
}

.keys {
  display: flex;
  flex-direction: column;
  .add {
    align-self: flex-end;
  }
}

.api-url {
  display: flex;

  > span {
    margin-right: 6px;
  }
}
</style>
