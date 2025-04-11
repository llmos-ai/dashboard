<script>
import day from 'dayjs';
import { isAdminUser } from '@shell/store/type-map';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import ButtonGroup from '@shell/components/ButtonGroup';
import { Checkbox } from '@shell/components/form/Checkbox';
import LandingPagePreference from '@shell/components/LandingPagePreference';
import {
  mapPref,
  THEME,
  KEYMAP,
  DATE_FORMAT,
  TIME_FORMAT,
  ROWS_PER_PAGE,
  HIDE_DESC,
  VIEW_IN_API,
  ALL_NAMESPACES,
  THEME_SHORTCUT,
  PLUGIN_DEVELOPER,
  MENU_MAX_CLUSTERS,
  VIEW_CONTAINER_DASHBOARD,
} from '@shell/store/prefs';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import { addObject } from '@shell/utils/array';
import LocaleSelector from '@shell/components/LocaleSelector';
import { isDevBuild } from '@shell/utils/version';

export default {
  layout:     'plain',
  components: {
    BackLink,
    ButtonGroup,
    LabeledSelect,
    Checkbox,
    LandingPagePreference,
    LocaleSelector,
  },
  mixins: [BackRoute],
  data() {
    return {
      admin: isAdminUser(this.$store.getters),
      isDevBuild,
    };
  },
  computed: {
    keymap:          mapPref(KEYMAP),
    viewInApi:       mapPref(VIEW_IN_API),
    allNamespaces:   mapPref(ALL_NAMESPACES),
    themeShortcut:   mapPref(THEME_SHORTCUT),
    dateFormat:      mapPref(DATE_FORMAT),
    timeFormat:      mapPref(TIME_FORMAT),
    perPage:         mapPref(ROWS_PER_PAGE),
    pluginDeveloper: mapPref(PLUGIN_DEVELOPER),

    theme: {
      get() {
        return this.$store.getters['prefs/get'](THEME);
      },
      set(neu) {
        this.$store.dispatch('prefs/setTheme', neu);
      },
    },

    themeOptions() {
      return this.$store.getters['prefs/options'](THEME).map((value) => {
        return {
          labelKey: `prefs.theme.${ value }`,
          value,
        };
      });
    },

    keymapOptions() {
      return this.$store.getters['prefs/options'](KEYMAP).map((value) => {
        return {
          labelKey: `prefs.keymap.${ value }`,
          value,
        };
      });
    },

    dateOptions() {
      const now = day();

      const currentDate = this.$store.getters['prefs/options'](DATE_FORMAT).map(
        (value) => {
          return now.format(value);
        }
      );

      // Check for duplication of date (date with same digit in month and day) in options list eg. (3/3/2023)
      const isDuplicate = currentDate.some((item, idx) => {
        return currentDate.indexOf(item) !== idx;
      });

      return this.$store.getters['prefs/options'](DATE_FORMAT).map(
        (value, index) => {
          const updateValue = `${ now.format(value) } (${ value })`;

          if (index > 1 && isDuplicate) {
            return {
              label: updateValue,
              value,
            };
          }

          return {
            label: now.format(value),
            value,
          };
        }
      );
    },

    pm() {
      const time = day().hour(18).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
    },

    am() {
      const time = day().hour(6).minute(0).second(0);

      return time.format(this.timeFormat.replace(/:ss/, ''));
    },

    timeOptions() {
      const now = day();

      return this.$store.getters['prefs/options'](TIME_FORMAT).map((value) => {
        return {
          label: now.format(value),
          value,
        };
      });
    },

    perPageOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](ROWS_PER_PAGE).map(
        (count) => ({
          label: t('prefs.perPage.value', { count }),
          value: count,
        })
      );
    },

    menuClusterOptions() {
      const t = this.$store.getters['i18n/t'];

      return this.$store.getters['prefs/options'](MENU_MAX_CLUSTERS).map(
        (count) => ({
          label: t('prefs.clusterToShow.value', { count }),
          value: count,
        })
      );
    },
  },
};
</script>

<template>
  <div>
    <BackLink :link="backLink" />
    <h1
      v-t="'prefs.title'"
      class="mb-20"
    />
    <!-- Language -->
    <div class="mt-10 mb-10">
      <h4 v-t="'prefs.language'" />
      <div class="row">
        <div class="col span-4">
          <LocaleSelector data-testid="prefs__languageSelector" />
        </div>
      </div>
    </div>
    <!-- Theme -->
    <div class="mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.theme.label'" />
      <ButtonGroup
        v-model:value="theme"
        data-testid="prefs__themeOptions"
        :options="themeOptions"
      />
      <div class="mt-10">
        <t
          k="prefs.theme.autoDetail"
          :pm="pm"
          :am="am"
        />
      </div>
    </div>
    <!-- Login landing page -->
    <div class="mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.landing.label'" />
      <LandingPagePreference data-testid="prefs__landingPagePreference" />
    </div>
    <!-- Display Settings -->
    <div class="mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.displaySettings.title'" />
      <p class="set-landing-leadin">
        {{ t('prefs.displaySettings.detail', {}, (raw = true)) }}
      </p>
      <div class="row mt-20">
        <div class="col span-4">
          <LabeledSelect
            v-model:value="dateFormat"
            data-testid="prefs__displaySetting__dateFormat"
            :label="t('prefs.dateFormat.label')"
            option-key="value"
            :options="dateOptions"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            v-model:value="timeFormat"
            data-testid="prefs__displaySetting__timeFormat"
            :label="t('prefs.timeFormat.label')"
            :options="timeOptions"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-4">
          <LabeledSelect
            v-model:value="perPage"
            data-testid="prefs__displaySetting__perPage"
            :label="t('prefs.perPage.label')"
            :options="perPageOptions"
            option-key="value"
            option-label="label"
            placeholder="Select a row count"
          />
        </div>
      </div>
    </div>
    <!-- Advanced Features -->
    <div class="col adv-features mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.advFeatures.title'" />
      <Checkbox
        v-model:value="viewInApi"
        data-testid="prefs__viewInApi"
        :label="t('prefs.advFeatures.viewInApi', {}, true)"
        class="mt-10"
      />
      <br>
      <Checkbox
        v-model:value="allNamespaces"
        data-testid="prefs__allNamespaces"
        :label="t('prefs.advFeatures.allNamespaces', {}, true)"
        class="mt-20"
      />
      <br>
      <Checkbox
        v-model:value="themeShortcut"
        data-testid="prefs__themeShortcut"
        :label="t('prefs.advFeatures.themeShortcut', {}, true)"
        class="mt-20"
      />
    </div>
    <!-- YAML editor key mapping -->
    <div class="col mt-10 mb-10">
      <hr>
      <h4 v-t="'prefs.keymap.label'" />
      <ButtonGroup
        v-model:value="keymap"
        data-testid="prefs__keymapOptions"
        :options="keymapOptions"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
hr {
  margin: 20px 0;
}
.wrap-text {
  overflow-wrap: break-word;
  max-width: 80vw;
  color: var(--input-label);
}
</style>
