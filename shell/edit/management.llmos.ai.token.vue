<script>
import DetailText from '@shell/components/DetailText';
import Footer from '@shell/components/form/Footer';
import Select from '@shell/components/form/Select';
import CreateEditView from '@shell/mixins/create-edit-view';
import { diffFrom } from '@shell/utils/time';
import { MANAGEMENT } from '@shell/config/types';

import { RadioGroup } from '@components/Form/Radio';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { mapGetters } from 'vuex';
import day from 'dayjs';
import { DESCRIPTION } from '@shell/config/labels-annotations';

export default {
  components: {
    DetailText,
    Footer,
    Select,
    Banner,
    LabeledInput,
    RadioGroup,
  },

  mixins: [CreateEditView],

  data() {
    // Get the setting that defines the max token TTL allowed (in minutes)
    const maxTTLSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, 'auth-token-max-ttl-minutes');
    let maxTTL = 0;

    try {
      maxTTL = parseInt(maxTTLSetting.value || maxTTLSetting.default, 10);
    } catch (e) {
      maxTTL = 0;
    }

    const description = this.value.annotations[DESCRIPTION];

    return {
      errors:  null,
      created: null,
      form:    {
        expiryType:        'never',
        customExpiry:      0,
        customExpiryUnits: 'minute',
      },
      accessKey: '',
      secretKey: '',
      token:     '',
      maxTTL,
      description
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    expiryOptions() {
      const options = ['never', 'day', 'month', 'year', 'custom'];
      let opts = options.map((opt) => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.expiry.options.${ opt }`) }));

      // When the TTL is anything other than 0, present only two options
      // (1) The maximum allowed
      // (2) Custom
      if (this.maxTTL !== 0 ) {
        const now = day();
        const expiry = now.add(this.maxTTL, 'minute');
        const max = diffFrom(expiry, now, this.t);

        opts = opts.filter((opt) => opt.value === 'custom');
        opts.unshift({ value: 'max', label: this.t('accountAndKeys.apiKeys.add.expiry.options.maximum', { value: max.string }) });
      }

      return opts;
    },

    expiryUnitsOptions() {
      const options = ['minute', 'hour', 'day', 'month', 'year'];
      const filtered = this.filterOptionsForTTL(options);

      return filtered.map((opt) => ({ value: opt, label: this.t(`accountAndKeys.apiKeys.add.customExpiry.options.${ opt }`) }));
    },
  },

  mounted() {
    // Auto-select the first option on load
    this.form.expiryType = this.expiryOptions[0].value;
  },

  methods: {
    done() {
      if (!this.created) {
        this.doneCreate();
      }
    },

    doneCreate() {
      this.$router.push({ name: 'account' });
    },

    filterOptionsForTTL(opts) {
      return opts.filter((option) => {
        if (option === 'never' ) {
          return this.maxTTL === 0;
        } else if (option === 'custom') {
          return true;
        } else {
          const now = day();
          const expiry = day().add(1, option);
          const ttl = expiry.diff(now) / 60000; // Convert to minutes

          return this.maxTTL === 0 || ttl <= this.maxTTL;
        }
      });
    },

    async actuallySave(url) {
      this.updateExpiry();
      this.updateDescription();
      if ( this.isCreate ) {
        const res = await this.value.save();

        this.created = res;

        const token = this.created.spec.token.split(':');

        this.accessKey = token[0];
        this.secretKey = (token.length > 1) ? token[1] : '';
        this.token = this.created.spec.token;

        // Force a refresh of the token so we get the expiry date correctly
        await this.$store.dispatch('management/find', {
          type: MANAGEMENT.TOKEN,
          id:   res.id,
          opt:  { force: true }
        }, { root: true });
      } else {
        // Note: update of existing key not supported currently
        await this.value.save();
      }
    },

    updateExpiry() {
      const v = this.form.expiryType;
      const increment = (v === 'custom') ? parseInt(this.form.customExpiry) : 1;
      const units = (v === 'custom') ? this.form.customExpiryUnits : v;
      let ttl = 0;

      if (units === 'max') {
        ttl = this.maxTTL * 60;
      } else if ( units !== 'never' ) {
        const now = day();
        const expiry = day().add(increment, units);

        ttl = expiry.diff(now, 's');
      }
      this.value.spec.ttlSeconds = ttl;
    },

    updateDescription() {
      if (this.description === '') {
        return;
      }
      if (!this.value.metadata.annotations) {
        this.value.metadata['annotations'] = {};
      }
      this.value.metadata.annotations[DESCRIPTION] = this.description;
    },
  }
};
</script>

<template>
  <div v-if="!created">
    <div class="pl-10 pr-10">
      <LabeledInput
        key="description"
        v-model:value="description"
        :placeholder="t('accountAndKeys.apiKeys.add.description.placeholder')"
        label-key="accountAndKeys.apiKeys.add.description.label"
        mode="edit"
        :min-height="30"
      />

      <h5 class="pt-20">
        {{ t('accountAndKeys.apiKeys.add.expiry.label') }}
      </h5>

      <div class="ml-10">
        <RadioGroup
          v-model:value="form.expiryType"
          :options="expiryOptions"
          class="mr-20"
          name="expiryGroup"
        />
        <div class="ml-20 mt-10 expiry">
          <a-input
            v-model:value="form.customExpiry"
            :disabled="form.expiryType !== 'custom'"
            type="number"
            :mode="mode"
          />
          <Select
            v-model:value="form.customExpiryUnits"
            :disabled="form.expiryType !== 'custom'"
            :options="expiryUnitsOptions"
            :clearable="false"
            :reduce="opt=>opt.value"
          />
        </div>
      </div>
    </div>
    <Footer
      :errors="errors"
      :mode="mode"
      @save="save"
      @done="done"
    />
  </div>
  <div v-else>
    <div>{{ t('accountAndKeys.apiKeys.info.keyCreated') }}</div>
    <DetailText
      :value="accessKey"
      label-key="accountAndKeys.apiKeys.info.accessKey"
      class="mt-20"
    />
    <DetailText
      :value="secretKey"
      label-key="accountAndKeys.apiKeys.info.secretKey"
      class="mt-20"
    />

    <p class="mt-20">
      {{ t('accountAndKeys.apiKeys.info.bearerTokenTip') }}
    </p>

    <DetailText
      :value="token"
      label-key="accountAndKeys.apiKeys.info.bearerToken"
      class="mt-20"
    />

    <Banner
      color="warning"
      class="mt-20"
    >
      <div>
        {{ t('accountAndKeys.apiKeys.info.saveWarning') }}
      </div>
    </Banner>

    <div class="buttons mt-20">
      <div class="right">
        <a-button
          type="primary"
          data-testid="token_done_create_button"
          @click="doneCreate"
        >
          <t k="generic.done" />
        </a-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .expiry {
    display: flex;
    > * {
      flex: 0 0 200px;
      margin-right: 10px;
    }
  }
</style>
