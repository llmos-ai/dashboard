<script>
import { mapGetters } from 'vuex';
import debounce from 'lodash/debounce';
import { MANAGEMENT, STEVE } from '@shell/config/types';
import { ucFirst } from '@shell/utils/string';
import { isAlternate, isMac } from '@shell/utils/platform';
import Import from '@shell/components/Import';
import BrandImage from '@shell/components/BrandImage';
import { getProduct } from '@shell/config/private-label';
import ClusterProviderIcon from '@shell/components/ClusterProviderIcon';
import ClusterBadge from '@shell/components/ClusterBadge';
import { LOGGED_OUT } from '@shell/config/query-params';
import NamespaceFilter from './NamespaceFilter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import TopLevelMenu from './TopLevelMenu';
import Jump from './Jump';
import AppModal from '@shell/components/AppModal';
import { allHash } from '@shell/utils/promise';
import { ActionLocation, ExtensionPoint } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import IconOrSvg from '@shell/components/IconOrSvg';
import { wait } from '@shell/utils/async';
import HeaderPageActionMenu from './HeaderPageActionMenu.vue';

import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger,
} from '@components/RcDropdown';

const PAGE_HEADER_ACTION = 'page-action';

export default {
  components: {
    AppModal,
    NamespaceFilter,
    WorkspaceSwitcher,
    Import,
    TopLevelMenu,
    Jump,
    BrandImage,
    ClusterBadge,
    ClusterProviderIcon,
    IconOrSvg,
    HeaderPageActionMenu,
    RcDropdown,
    RcDropdownItem,
    RcDropdownSeparator,
    RcDropdownTrigger,
  },

  props: {
    simple: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    const searchShortcut = isMac ? '(\u2318-K)' : '(Ctrl+K)';
    const shellShortcut = '(Ctrl+`)';

    return {
      show: false,
      showTooltip: false,
      kubeConfigCopying: false,
      searchShortcut,
      shellShortcut,
      LOGGED_OUT,
      navHeaderRight: null,
      extensionHeaderActions: getApplicableExtensionEnhancements(
        this,
        ExtensionPoint.ACTION,
        ActionLocation.HEADER,
        this.$route
      ),
      ctx: this,
      showImportModal: false,
      showSearchModal: false,
    };
  },

  computed: {
    ...mapGetters([
      'clusterReady',
      'isExplorer',
      'isMgmt',
      'currentCluster',
      'currentProduct',
      'backToRancherLink',
      'backToRancherGlobalLink',
      'pageActions',
      'showTopLevelMenu',
    ]),
    ...mapGetters('type-map', ['activeProducts']),

    appName() {
      return getProduct();
    },

    authEnabled() {
      return this.$store.getters['auth/enabled'];
    },

    generateLogoutRoute() {
      console.log('---aaa');
      return { name: 'auth-logout', query: { [LOGGED_OUT]: true } };
    },

    loggedInUser() {
      const user =
        this.$store.getters['management/byId'](
          MANAGEMENT.USER,
          this.$store.getters['auth/principalId']
        ) || {};
      return user;
    },

    kubeConfigEnabled() {
      return true;
    },

    shellEnabled() {
      return !!this.currentCluster?.links?.shell;
    },

    showKubeShell() {
      return !this.currentProduct?.hideKubeShell;
    },

    showKubeConfig() {
      return !this.currentProduct?.hideKubeConfig;
    },

    showCopyConfig() {
      return !this.currentProduct?.hideCopyConfig;
    },

    showPreferencesLink() {
      return (
        this.$store.getters['management/schemaFor'](
          STEVE.PREFERENCE,
          false,
          false
        )?.resourceMethods || []
      ).includes('PUT');
    },

    showAccountAndApiKeyLink() {
      // TODO: why is this here?
      return this.isMgmt;
    },

    showPageActions() {
      return !this.featureRancherDesktop && this.pageActions?.length;
    },

    showUserMenu() {
      return !this.featureRancherDesktop;
    },

    showFilter() {
      // Some products won't have a current cluster
      const validClusterOrProduct =
        this.currentCluster ||
        (this.currentProduct && this.currentProduct.customNamespaceFilter) ||
        (this.currentProduct && this.currentProduct.showWorkspaceSwitcher);
      // Don't show if the header is in 'simple' mode
      const notSimple = !this.simple;
      // One of these must be enabled, otherwise t here's no component to show
      const validFilterSettings =
        this.currentProduct.showNamespaceFilter ||
        this.currentProduct.showWorkspaceSwitcher;

      return validClusterOrProduct && notSimple && validFilterSettings;
    },

    featureRancherDesktop() {
      return this.$config.productEnv === 'desktop';
    },

    importEnabled() {
      return !!this.currentCluster?.actions?.apply;
    },

    prod() {
      const name = this.currentProduct.name;

      return this.$store.getters['i18n/withFallback'](
        `product."${name}"`,
        null,
        ucFirst(name)
      );
    },

    category() {
      return this.$store.getters['i18n/withFallback'](
        `product.${this.currentProduct.category}.label`,
        null,
        this.currentProduct.category
      );
    },

    showSearch() {
      return this.currentProduct?.inStore === 'cluster';
    },

    showImportYaml() {
      return this.currentProduct?.inStore !== 'llmos';
    },

    nameTooltip() {
      return !this.showTooltip
        ? {}
        : {
            content: this.currentCluster?.nameDisplay,
            delay: 400,
          };
    },
  },

  watch: {
    currentCluster(nue, old) {
      if (nue && old && nue.id !== old.id) {
        this.checkClusterName();
      }
    },
    // since the Header is a "persistent component" we need to update it at every route change...
    $route(nue) {
      if (nue) {
        this.extensionHeaderActions = getApplicableExtensionEnhancements(
          this,
          ExtensionPoint.ACTION,
          ActionLocation.HEADER,
          nue
        );

        this.navHeaderRight = this.$plugin?.getDynamic(
          'component',
          'NavHeaderRight'
        );
      }
    },
  },

  mounted() {
    this.checkClusterName();
    this.debouncedLayoutHeader = debounce(this.layoutHeader, 400);
    window.addEventListener('resize', this.debouncedLayoutHeader);

    this.$nextTick(() => this.layoutHeader(null, true));
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedLayoutHeader);
  },

  methods: {
    // Sizes the product area of the header such that it shrinks to ensure the whole header bar can be shown
    // where possible - we use a minimum width of 32px which is enough to just show the product icon
    layoutHeader() {
      const header = this.$refs.header;
      const product = this.$refs.product;

      if (!header || !product) {
        return;
      }

      // If the product element has an exact size, remove it and then recalculate
      if (product.style.width) {
        product.style.width = '';

        this.$nextTick(() => this.layoutHeader());

        return;
      }

      const overflow = header.scrollWidth - window.innerWidth;

      if (overflow > 0) {
        const w = Math.max(32, product.offsetWidth - overflow);

        // Set exact width on the product div so that the content in it fits that available space
        product.style.width = `${w}px`;
      }
    },

    openSearch() {
      this.showSearchModal = true;
    },

    hideSearch() {
      this.showSearchModal = false;
    },

    openImport() {
      this.showImportModal = true;
    },

    closeImport() {
      this.showImportModal = false;
    },

    openSearch() {
      this.showSearchModal = true;
    },

    hideSearch() {
      this.showSearchModal = false;
    },

    pageAction(action) {
      this.$nuxt.$emit(PAGE_HEADER_ACTION, action);
    },

    checkClusterName() {
      this.$nextTick(() => {
        const el = this.$refs.clusterName;

        this.showTooltip = el && el.clientWidth < el.scrollWidth;
      });
    },

    copyKubeConfig(event) {
      const button = event.target?.parentElement;

      if (this.kubeConfigCopying) {
        return;
      }

      this.kubeConfigCopying = true;

      if (button) {
        button.classList.add('header-btn-active');
      }

      // Make sure we wait at least 1 second so that the user can see the visual indication that the config has been copied
      allHash({
        copy: this.currentCluster.copyKubeConfig(),
        minDelay: wait(1000),
      }).finally(() => {
        this.kubeConfigCopying = false;

        if (button) {
          button.classList.remove('header-btn-active');
        }
      });
    },

    handleExtensionAction(action, event) {
      const fn = action.invoke;
      const opts = {
        event,
        action,
        isAlt: isAlternate(event),
        product: this.currentProduct.name,
        cluster: this.currentCluster,
      };
      const enabled = action.enabled
        ? action.enabled.apply(this, [this.ctx])
        : true;

      if (fn && enabled) {
        fn.apply(this, [opts, [], { $route: this.$route }]);
      }
    },

    handleExtensionTooltip(action) {
      if (action.tooltipKey || action.tooltip) {
        const tooltip = action.tooltipKey
          ? this.t(action.tooltipKey)
          : action.tooltip;
        const shortcut = action.shortcutLabel ? action.shortcutLabel() : '';

        return `${tooltip} ${shortcut}`;
      }

      return null;
    },
  },
};
</script>

<template>
  <header ref="header" class="flex" data-testid="header">
    <!-- side menu -->
    <div>
      <TopLevelMenu v-if="showTopLevelMenu" />
    </div>

    <div v-if="!simple" ref="product" class="product">
      <div
        v-if="currentProduct && currentProduct.showClusterSwitcher"
        v-clean-tooltip="nameTooltip"
        class="cluster cluster-clipped"
      >
        <ClusterProviderIcon
          v-if="currentCluster"
          :cluster="currentCluster"
          class="mr-10"
        />
        <div v-if="currentCluster" ref="clusterName" class="cluster-name">
          {{ currentCluster.displayName }}
        </div>
        <ClusterBadge
          v-if="currentCluster"
          :cluster="currentCluster"
          class="ml-10"
        />
        <div v-if="!currentCluster" class="simple-title">
          <BrandImage class="side-menu-logo-img" file-name="logo.svg" />
        </div>
      </div>

      <div
        v-if="currentProduct && !currentProduct.showClusterSwitcher"
        class="cluster"
      >
        <img
          v-if="currentProduct.iconHeader"
          v-bind="$attrs"
          :src="currentProduct.iconHeader"
          class="cluster-os-logo mr-10"
          style="width: 44px; height: 36px"
        />
        <div class="product-name">
          {{ prod }}
        </div>
      </div>
    </div>

    <div v-else class="simple-title">
      <div class="side-menu-logo">
        <BrandImage class="side-menu-logo-img" file-name="logo.svg" />
      </div>
    </div>

    <div class="spacer" />

    <div class="rd-header-right">
      <component :is="navHeaderRight" />

      <div v-if="showFilter" class="top">
        <NamespaceFilter
          v-if="
            clusterReady &&
            currentProduct &&
            (currentProduct.showNamespaceFilter || isExplorer)
          "
        />
        <WorkspaceSwitcher
          v-else-if="
            clusterReady &&
            currentProduct &&
            currentProduct.showWorkspaceSwitcher
          "
        />
      </div>
      <div v-if="currentCluster && !simple" class="header-buttons">
        <template v-if="currentProduct && currentProduct.showClusterSwitcher">
          <a-button
            v-if="showImportYaml"
            v-clean-tooltip="t('nav.import')"
            :disabled="!importEnabled"
            type="text"
            @click="openImport()"
          >
            <i class="icon icon-upload icon-lg" />
          </a-button>
          <app-modal
            v-if="showImportModal"
            class="import-modal"
            name="importModal"
            width="75%"
            height="auto"
            styles="max-height: 90vh;"
            @close="closeImport"
          >
            <Import :cluster="currentCluster" @close="closeImport" />
          </app-modal>

          <a-button
            v-if="showKubeShell"
            id="btn-kubectl"
            v-clean-tooltip="t('nav.shellShortcut', { key: shellShortcut })"
            v-shortkey="{ windows: ['ctrl', '`'], mac: ['meta', '`'] }"
            :disabled="!shellEnabled"
            type="text"
            @shortkey="currentCluster.openShell()"
            @click="currentCluster.openShell()"
          >
            <i class="icon icon-terminal icon-lg" />
          </a-button>

          <a-button
            v-if="showKubeConfig"
            v-clean-tooltip="t('nav.kubeconfig.download')"
            :disabled="!kubeConfigEnabled"
            type="text"
            @click="currentCluster.downloadKubeConfig()"
          >
            <i class="icon icon-file icon-lg" />
          </a-button>

          <a-button
            v-if="showCopyConfig"
            v-clean-tooltip="t('nav.kubeconfig.copy')"
            :disabled="!kubeConfigEnabled"
            type="text"
            @click="copyKubeConfig($event)"
          >
            <i v-if="kubeConfigCopying" class="icon icon-checkmark icon-lg" />
            <i v-else class="icon icon-copy icon-lg" />
          </a-button>
        </template>

        <a-button
          v-if="showSearch"
          v-clean-tooltip="
            t('nav.resourceSearch.toolTip', { key: searchShortcut })
          "
          v-shortkey="{ windows: ['ctrl', 'k'], mac: ['meta', 'k'] }"
          type="text"
          id="header-btn-search"
          @shortkey="openSearch()"
          @click="openSearch()"
        >
          <i class="icon icon-search icon-lg" />
        </a-button>
        <app-modal
          v-if="showSearch && showSearchModal"
          class="search-modal"
          name="searchModal"
          width="50%"
          height="auto"
          :trigger-focus-trap="true"
          return-focus-selector="#header-btn-search"
          @close="hideSearch()"
        >
          <Jump @closeSearch="hideSearch()" />
        </app-modal>
      </div>

      <!-- Extension header actions -->
      <div v-if="extensionHeaderActions.length" class="header-buttons">
        <a-button
          v-for="(action, i) in extensionHeaderActions"
          :key="`${action.label}${i}`"
          v-clean-tooltip="handleExtensionTooltip(action)"
          v-shortkey="action.shortcutKey"
          :disabled="action.enabled ? !action.enabled(ctx) : false"
          type="text"
          @shortkey="handleExtensionAction(action, $event)"
          @click="handleExtensionAction(action, $event)"
        >
          <IconOrSvg
            class="icon icon-lg"
            :icon="action.icon"
            :src="action.svg"
            color="header"
          />
        </a-button>
      </div>

      <div class="flex items-center">
        <!-- page action -->
        <header-page-action-menu v-if="showPageActions" />

        <!-- userMenu action -->
        <!-- TODO: use option refactor -->
        <a-dropdown v-if="showUserMenu" trigger="click">
          <div>
            <img
              v-if="loggedInUser && loggedInUser.avatarSrc"
              :src="loggedInUser.avatarSrc"
              :class="{ 'avatar-round': loggedInUser.roundAvatar }"
              width="36"
              height="36"
            />
            <i v-else class="icon icon-user icon-3x avatar" />
          </div>

          <template #overlay>
            <a-menu>
              <a-menu-item class="w-3xs">
                <div class="user-info" v-if="authEnabled">
                  <div class="user-name">
                    <i class="icon icon-lg icon-user" />
                    {{ loggedInUser.loginName }}
                  </div>
                  <div class="text-small">
                    <template
                      v-if="loggedInUser.loginName !== loggedInUser.name"
                    >
                      {{ loggedInUser.name }}
                    </template>
                  </div>
                </div>
              </a-menu-item>

              <a-menu-item v-if="showPreferencesLink">
                <div @click="$router.push({ name: 'prefs' })">
                  {{ t('nav.userMenu.preferences') }}
                </div>
              </a-menu-item>

              <a-menu-item v-if="showAccountAndApiKeyLink">
                <div @click="$router.push({ name: 'account' })">
                  {{ t('nav.userMenu.accountAndKeys', {}, true) }}
                </div>
              </a-menu-item>

              <!-- <a-menu-item v-if="authEnabled">
                <div @click="showSloModal">
                  {{ t("nav.userMenu.logOut") }}
                </div>
              </a-menu-item> -->

              <a-menu-item v-if="authEnabled">
                <div @click="$router.push(generateLogoutRoute)">
                  {{ t('nav.userMenu.logOut') }}
                </div>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
HEADER {
  display: flex;
  z-index: z-index('mainHeader');

  > .spacer {
    flex: 1;
  }

  > .menu-spacer {
    flex: 0 0 15px;
  }

  .title {
    border-left: 1px solid var(--header-border);
    padding-left: 10px;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .filter {
    :deep() .labeled-select,
    :deep() .unlabeled-select {
      .vs__search::placeholder {
        color: var(--body-text) !important;
      }

      .vs__dropdown-toggle .vs__actions:after {
        color: var(--body-text) !important;
      }

      .vs__dropdown-toggle {
        background: transparent;
        border: 1px solid var(--header-border);
      }
    }
  }

  .back {
    padding-top: 6px;

    > *:first-child {
      height: 40px;
    }
  }

  .simple-title {
    max-width: 200px;
    width: 200px;

    .title {
      height: 24px;
      line-height: 24px;
    }
  }

  .cluster {
    align-items: center;
    display: flex;
    height: 32px;
    white-space: nowrap;
    .cluster-name {
      font-size: 16px;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    &.cluster-clipped {
      overflow: hidden;
    }
  }

  > .product {
    align-items: center;
    position: relative;
    display: flex;
    padding-left: 10px;

    .logo {
      height: 30px;
      position: absolute;
      top: 9px;
      left: 0;
      z-index: 2;

      img {
        height: 30px;
      }
    }
  }

  .product-name {
    font-size: 16px;
  }

  .side-menu-logo {
    align-items: center;
    display: flex;
    margin-right: 8px;
    height: 60px;
    margin-left: 10px;
    max-width: 200px;
    padding: 12px 0;
  }

  .side-menu-logo-img {
    object-fit: contain;
    height: 30px;
    max-width: 200px;
  }

  > * {
    background-color: var(--header-bg);
    border-bottom: var(--header-border-size) solid var(--header-border);
  }

  .rd-header-right {
    display: flex;
    flex-direction: row;
    padding: 0;

    > * {
      padding: 0 5px;
    }

    > .top {
      padding-top: 6px;

      INPUT[type='search']::placeholder,
      .vs__open-indicator,
      .vs__selected {
        color: var(--header-btn-bg) !important;
        background: var(--header-btn-bg);
        border-radius: var(--border-radius);
        border: none;
        margin: 0 35px 0 25px !important;
      }

      .vs__selected {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }

      .vs__deselect {
        fill: var(--header-btn-bg);
      }

      .filter .vs__dropdown-toggle {
        background: var(--header-btn-bg);
        border-radius: var(--border-radius);
        border: none;
        margin: 0 35px 0 25px !important;
      }
    }

    .header-buttons {
      align-items: center;
      display: flex;
      margin-top: 1px;

      // Spacing between header buttons
      .btn:not(:last-of-type) {
        margin-right: 10px;
      }

      .btn:focus {
        box-shadow: none;
      }

      > .header-btn {
        &.header-btn-active,
        &.header-btn-active:hover {
          background-color: var(--success);
          color: var(--success-text);
        }

        img {
          height: 20px;
          width: 20px;
        }
      }
    }

    .header-btn {
      width: 40px;
    }

    :deep() > div > .btn.role-tertiary {
      border: 1px solid var(--header-btn-bg);
      border: none;
      background: var(--header-btn-bg);
      color: var(--header-btn-text);
      padding: 0 10px;
      line-height: 32px;
      min-height: 32px;

      i {
        // Ideally same height as the parent button, but this means tooltip needs adjusting (which is it's own can of worms)
        line-height: 20px;
      }

      &:hover {
        background: var(--primary);
        color: #fff;
      }

      &[disabled='disabled'] {
        background-color: rgba(0, 0, 0, 0.25) !important;
        color: var(--header-btn-text) !important;
        opacity: 0.7;
      }
    }

    .actions {
      align-items: center;
      cursor: pointer;
      display: flex;

      > I {
        font-size: 18px;
        padding: 6px;
        &:hover {
          color: var(--link);
        }
      }
    }

    .header-spacer {
      background-color: var(--header-bg);
      position: relative;
    }

    .user-menu {
      padding-top: 9.5px;
    }

    > .user {
      outline: none;
      width: var(--header-height);

      .user-image {
        display: flex;
        align-items: center;
      }

      background-color: var(--header-bg);

      .avatar-round {
        border: 0;
        border-radius: 50%;
      }
    }
  }
}

.list-unstyled {
  li {
    a {
      display: flex;
      justify-content: space-between;
      padding: 10px;
    }

    &.user-info {
      display: block;
      margin-bottom: 10px;
      padding: 10px 20px;
      border-bottom: solid 1px var(--border);
      min-width: 200px;
    }
  }
}

.config-actions {
  li {
    a {
      justify-content: start;
      align-items: center;

      & .icon {
        margin: 0 4px;
      }

      &:hover {
        cursor: pointer;
      }
    }
  }
}

.popover .popover-inner {
  padding: 0;
  border-radius: 0;
}

.user-name {
  display: flex;
  align-items: center;
  color: var(--secondary);
}

.user-menu {
  // Remove the default padding on the popup so that the hover on menu items goes full width of the menu
  :deep() .popover-inner {
    padding: 10px 0;
  }
}

.actions {
  :deep() .popover:focus {
    outline: 0;
  }

  .dropdown {
    margin: 0 -10px;
  }
}

.user-menu-item {
  a {
    cursor: hand;
    padding: 0px 10px;

    &:hover {
      background-color: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
      text-decoration: none;
    }

    // When the menu item is focused, pop the margin and compensate the padding, so that
    // the focus border appears within the menu
    &:focus {
      margin: 0 2px;
      padding: 10px 8px;
    }
  }

  div.menu-separator {
    cursor: default;
    padding: 4px 0;

    .menu-separator-line {
      background-color: var(--border);
      height: 1px;
    }
  }
}
</style>
