<script>
import { mapState, mapGetters } from 'vuex';
import {
  mapPref,
  AFTER_LOGIN_ROUTE,
  THEME_SHORTCUT
} from '@shell/store/prefs';
import ActionMenu from '@shell/components/ActionMenu';
import GrowlManager from '@shell/components/GrowlManager';
import WindowManager from '@shell/components/nav/WindowManager';
import PromptRemove from '@shell/components/PromptRemove';
import PromptModal from '@shell/components/PromptModal';
import Header from '@shell/components/nav/Header';
import Inactivity from '@shell/components/Inactivity';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import DraggableZone from '@shell/components/DraggableZone';
import { MANAGEMENT } from '@shell/config/types';
import isEqual from 'lodash/isEqual';
import { markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import { getClusterFromRoute, getProductFromRoute } from '@shell/utils/router';
import { BOTTOM } from '@shell/utils/position';
import SideNav from '@shell/components/SideNav';
import { BLANK_CLUSTER } from '@shell/store';

const SET_LOGIN_ACTION = 'set-as-login';

export default {
  name:       'DefaultLayout',
  components: {
    PromptRemove,
    PromptModal,
    Header,
    ActionMenu,
    GrowlManager,
    WindowManager,
    FixedBanner,
    DraggableZone,
    Inactivity,
    SideNav,
  },

  mixins: [PageHeaderActions, Brand, BrowserTabVisibility],

  // Note - This will not run on route change
  data() {
    return {
      noLocaleShortcut: process.env.dev || false,
      wantNavSync:      false,
      unwatchPin:       undefined,
      wmPin:            null,
      draggable:        false,
    };
  },

  // Note - These will run on route change
  middleware: [
    'authenticated'
  ],

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['clusterId', 'currentProduct', 'showTopLevelMenu']),

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

    themeShortcut: mapPref(THEME_SHORTCUT),

    pageActions() {
      const pageActions = [];
      const product = this.currentProduct;

      if ( !product ) {
        return [];
      }

      // Only show for Cluster Explorer or Global Apps (not configuration)
      const canSetAsHome = product.inStore === 'cluster' || (product.inStore === 'management' && product.category !== 'configuration');

      if (canSetAsHome) {
        pageActions.push({
          labelKey: 'nav.header.setLoginPage',
          action:   SET_LOGIN_ACTION
        });
      }

      return pageActions;
    },

    unmatchedRoute() {
      return !this.$route?.matched?.length;
    },

    /**
     * When navigation involves unloading one cluster and loading another, clusterReady toggles from true->false->true in middleware (before new route content renders)
     * Prevent rendering "outlet" until the route changes to avoid re-rendering old route content after its cluster is unloaded
     */
    clusterAndRouteReady() {
      const targetRoute = this.$store.getters['targetRoute'];
      const routeReady = targetRoute ? this.currentProduct?.name === getProductFromRoute(this.$route) && this.currentProduct?.name === getProductFromRoute(targetRoute) : this.currentProduct?.name === getProductFromRoute(this.$route);

      return this.clusterReady &&
        this.clusterId === getClusterFromRoute(this.$route) && routeReady;
    },

    pinClass() {
      return `pin-${ this.wmPin }`;
    },

  },

  watch: {
    clusterId(a, b) {
      if ( !isEqual(a, b) ) {
        // Store the last visited route when the cluster changes
        this.setClusterAsLastRoute();
      }
    },

    async currentProduct(a, b) {
      if ( !isEqual(a, b) ) {
        if ((a.inStore !== b.inStore || a.inStore !== 'cluster') && this.clusterId && a.name) {
          const route = {
            name:   'c-cluster-product',
            params: {
              cluster: this.clusterId,
              product: a.name,
            }
          };

          await this.$store.dispatch('prefs/setLastVisited', route);
        }
      }
    },
  },

  async created() {
    await this.$store.dispatch('prefs/setLastVisited', this.$route);
  },

  mounted() {
    this.wmPin = window.localStorage.getItem('wm-pin') || BOTTOM;

    // two-way binding this.wmPin <-> draggableZone.pin
    this.$refs.draggableZone.pin = this.wmPin;
    this.unwatchPin = this.$watch('$refs.draggableZone.pin', (pin) => {
      this.wmPin = pin;
    });
  },

  unmounted() {
    this.unwatchPin();
  },

  methods: {
    async setClusterAsLastRoute() {
      if (!this.clusterId || this.clusterId === BLANK_CLUSTER) {
        return;
      }
      const route = {
        name:   this.$route.name,
        params: {
          ...this.$route.params,
          cluster: this.clusterId,
        }
      };

      await this.$store.dispatch('prefs/setLastVisited', route);
    },

    handlePageAction(action) {
      if (action.action === SET_LOGIN_ACTION) {
        this.afterLoginRoute = this.getLoginRoute();
        // Mark release notes as seen, so that the login route is honoured
        markSeenReleaseNotes(this.$store);
      }
    },

    getLoginRoute() {
      return {
        name:   this.$route.name,
        params: this.$route.params
      };
    },

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },

    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },

    wheresMyDebugger() {
      // vue-shortkey is preventing F8 from passing through to the browser... this works for now.
      // eslint-disable-next-line no-debugger
      debugger;
    },

    async toggleShell() {
      const clusterId = this.$route.params.cluster;

      if ( !clusterId ) {
        return;
      }

      const cluster = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id:   clusterId,
      });

      if (!cluster ) {
        return;
      }

      cluster.openShell();
    },
  }
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <div
      v-if="managementReady"
      class="dashboard-content"
      :class="{[pinClass]: true, 'dashboard-padding-left': showTopLevelMenu}"
    >
      <Header />
      <SideNav
        v-if="clusterReady"
        class="default-side-nav"
      />
      <main
        v-if="clusterAndRouteReady"
        class="main-layout"
      >
        <nuxt class="outlet" />
        <ActionMenu />
        <PromptRemove />
        <PromptModal />
        <button
          v-if="noLocaleShortcut"
          v-shortkey.once="['shift','l']"
          class="hide"
          @shortkey="toggleNoneLocale()"
        />
        <button
          v-if="themeShortcut"
          v-shortkey.once="['shift','t']"
          class="hide"
          @shortkey="toggleTheme()"
        />
        <button
          v-shortkey.once="['f8']"
          class="hide"
          @shortkey="wheresMyDebugger()"
        />
        <button
          v-shortkey.once="['`']"
          class="hide"
          @shortkey="toggleShell"
        />
      </main>
      <!-- Ensure there's an outlet to show the error (404) page -->
      <main
        v-else-if="unmatchedRoute"
        class="main-layout"
      >
        <nuxt class="outlet" />
      </main>
      <div
        v-if="$refs.draggableZone"
        class="wm"
        :class="{
          'drag-end': !$refs.draggableZone.drag.active,
          'drag-start': $refs.draggableZone.drag.active,
        }"
        :draggable="draggable"
        @dragstart="$refs.draggableZone.onDragStart($event)"
        @dragend="$refs.draggableZone.onDragEnd($event)"
      >
        <WindowManager @draggable="draggable=$event" />
      </div>
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
    <Inactivity />
    <DraggableZone ref="draggableZone" />
  </div>
</template>
<style lang="scss">
.dashboard-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dashboard-content {
  display: grid;
  position: relative;
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0px;

  &.dashboard-padding-left {
    padding-left: $app-bar-collapsed-width;

    .overlay-content-mode {
      left: calc(var(--nav-width) + $app-bar-collapsed-width);
    }
  }

  &.pin-right {
    grid-template-areas:
        "header  header  header"
        "nav      main     wm";
    grid-template-rows:    var(--header-height) auto;
    grid-template-columns: var(--nav-width)     auto var(--wm-width, 0px);
  }

  &.pin-bottom {
    grid-template-areas:
        "header  header"
        "nav       main"
        "wm         wm";
    grid-template-rows:    var(--header-height) auto  var(--wm-height, 0px);
    grid-template-columns: var(--nav-width)     auto;
  }

  &.pin-left {
    grid-template-areas:
        "header  header  header"
        "wm       nav     main";
    grid-template-rows:    var(--header-height) auto;
    grid-template-columns: var(--wm-width, 0px) var(--nav-width) auto;
  }

  > HEADER {
    grid-area: header;
  }

  .default-side-nav {
    grid-area: nav;
  }
}

.wm {
  grid-area: wm;
  overflow-y: hidden;
  z-index: 1;
}

.localeSelector {
  ::v-deep .popover-inner {
    padding: 50px 0;
  }

  ::v-deep .popover-arrow {
    display: none;
  }

  ::v-deep .popover:focus {
    outline: 0;
  }

  li {
    padding: 8px 20px;

    &:hover {
      background-color: var(--primary-hover-bg);
      color: var(--primary-hover-text);
      text-decoration: none;
    }
  }
}

.drag-start {
  z-index: 1000;
  opacity: 0.5;
  transition: opacity .3s ease;
}

.drag-end {
  opacity: 1;
}
</style>
