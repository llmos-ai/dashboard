<script>
import { mapPref, THEME_SHORTCUT } from '@shell/store/prefs';
import ActionMenu from '@shell/components/ActionMenu';
import Header from '@shell/components/nav/Header';
import PromptRemove from '@shell/components/PromptRemove';
import IndentedPanel from '@shell/components/IndentedPanel';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import { mapGetters } from 'vuex';
import PromptModal from '@shell/components/PromptModal';

export default {
  components: {
    ActionMenu,
    Header,
    IndentedPanel,
    PromptRemove,
    PromptModal,
    FixedBanner,
    GrowlManager,
  },

  mixins: [Brand, BrowserTabVisibility],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name:             this.$route.name,
      noLocaleShortcut: process.env.dev || false,
    };
  },

  computed: {
    themeShortcut: mapPref(THEME_SHORTCUT),
    ...mapGetters(['showTopLevelMenu']),
  },

  methods: {
    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },
    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },
  },
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />

    <div
      class="dashboard-content"
      :class="{ 'dashboard-padding-left': showTopLevelMenu }"
    >
      <Header :simple="true" />
      <main class="main-layout">
        <IndentedPanel class="pt-20">
          <router-view
            :key="$route.path"
            class="outlet"
          />
        </IndentedPanel>
        <ActionMenu />
        <PromptRemove />
        <PromptModal />
        <a-button
          v-if="themeShortcut"
          v-shortkey.once="['shift', 't']"
          class="hide"
          @shortkey="toggleTheme()"
        />
        <a-button
          v-if="noLocaleShortcut"
          v-shortkey.once="['shift', 'l']"
          class="hide"
          @shortkey="toggleNoneLocale()"
        />
      </main>
    </div>

    <FixedBanner :footer="true" />
    <GrowlManager />
  </div>
</template>

<style lang="scss" scoped>
.dashboard-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.dashboard-content {
  display: grid;
  flex-grow: 1;

  grid-template-areas:
    'header'
    'main';

  grid-template-columns: auto;
  grid-template-rows: var(--header-height) auto;

  > HEADER {
    grid-area: header;
  }
}

MAIN {
  grid-area: main;
  overflow: auto;

  .outlet {
    min-height: 100%;
    padding: 0;
  }
}
</style>
