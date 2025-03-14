<script>
import Loading from '@shell/components/Loading';
import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import KeyValue from '@shell/components/form/KeyValue';
import { mapGetters } from 'vuex';
import DefaultLinksEditor from './DefaultLinksEditor';
import { CUSTOM_LINKS_VERSION, fetchLinks } from '@shell/config/home-links';

export default {
  layout:     'authenticated',
  components: {
    KeyValue,
    Loading,
    AsyncButton,
    Banner,
    DefaultLinksEditor,
  },
  async fetch() {
    this.value = await fetchLinks(this.$store, this.hasSupport, false, (str) => this.t(str));
  },

  data() {
    return {
      defaultsDisabled: true,
      hasSupport:       false,
      uiCustomLinks:    {},
      bannerVal:        {},
      value:            [],
      errors:           [],
    };
  },
  computed: {
    ...mapGetters({ multiWithFallback: 'i18n/multiWithFallback' }),

    mode() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.SETTING);

      return schema?.resourceMethods?.includes('PUT') ? _EDIT : _VIEW;
    },

    allValues() {
      return {
        version:  CUSTOM_LINKS_VERSION,
        defaults: this.value.defaults.filter((obj) => obj.enabled).map((obj) => obj.key),
        custom:   this.value.custom
      };
    },
  },
  methods: {
    deprecateIssueLinks() {
      if (this.uiIssuesSetting.value || this.uiIssuesSetting.value) {
        this.uiIssuesSetting.value = '';
        this.uiCommunitySetting.value = '';

        return this.uiIssuesSetting.save();
      }
    },

    async save(btnCB) {
      this.errors = [];
      try {
        this.value = await fetchLinks(this.$store, this.hasSupport, false, (str) => this.t(str));
        btnCB(true);
      } catch (err) {
        this.errors.push(err);
        btnCB(false);
      }
    },
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1 class="mb-20">
      {{ t("customLinks.label") }}
    </h1>
    <div>
      <label class="text-label">
        {{ t(`customLinks.description`, {}, true) }}
      </label>
    </div>
    <div class="mt-20">
      <KeyValue
        v-model:value="value.custom"
        :title="'Custom Links'"
        :as-map="false"
        key-name="label"
        :key-label="t('customLinks.settings.keyLabel')"
        :value-label="t('customLinks.settings.valueLabel')"
        :add-label="t('customLinks.addLink')"
        :read-allowed="false"
        :protip="false"
        :mode="mode"
      />
    </div>
    <div class="ui-links-setting mt-20">
      <DefaultLinksEditor
        v-model:value="value.defaults"
        :mode="mode"
      />
    </div>
    <template  v-for="(err, i) in errors" :key="i" >
      <Banner
        color="error"
        :label="err"
      />
    </template>
    <div
      v-if="mode === 'edit'"
      class="mt-20"
    >
      <AsyncButton
        class="pull-right"
        mode="apply"
        @click="save"
      />
    </div>
  </div>
</template>
<style scoped lang='scss'>
.overlay {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--overlay-bg);
  z-index: 1;
}
.ui-links-setting {
  P {
    line-height: 1.25;
    margin-bottom: 10px;
  }

  .underline {
    text-decoration: underline;
  }
}
.action {
  display: flex;
  input {
    margin-right: 5px;
  }
}
</style>
