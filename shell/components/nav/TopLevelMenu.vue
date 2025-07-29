<script>
import { h } from 'vue';
import IconOrSvg from '../IconOrSvg';
import { BLANK_CLUSTER } from '@shell/store';
import { mapGetters } from 'vuex';
import { MANAGEMENT, STEVE } from '@shell/config/types';
import {
  MENU_MAX_CLUSTERS,
  VIEW_CONTAINER_DASHBOARD,
} from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { getVersionInfo } from '@shell/utils/version';
import { SETTING } from '@shell/config/settings';
import { getProductFromRoute } from '@shell/utils/router';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import {
  HomeOutlined, SettingOutlined, UsergroupAddOutlined, ControlOutlined, AppstoreOutlined
} from '@ant-design/icons-vue';
import { Tag } from 'ant-design-vue';

export default {
  data() {
    const { displayVersion, fullVersion } = getVersionInfo(this.$store);

    return {
      shown:                  false,
      displayVersion,
      fullVersion,
      clusterFilter:          '',
      maxClustersToShow:      MENU_MAX_CLUSTERS,
      emptyCluster:           BLANK_CLUSTER,
      showPinClusters:        false,
      searchActive:           false,
      viewContainerDashboard: false,
      selectedKeys:           [],
      showAppsMenu:           true, // 默认显示Apps菜单
    };
  },

  async fetch() {
    this.viewContainerDashboard = this.$store.getters['prefs/get'](
      VIEW_CONTAINER_DASHBOARD
    );

    // 检查llmos-agent插件状态
    await this.checkAgentAddonStatus();
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters([
      'clusterReady',
      'isMgmt',
      'currentCluster',
      'currentProduct',
    ]),

    showPreferencesLink() {
      return (
        this.$store.getters['management/schemaFor'](
          STEVE.PREFERENCE,
          false,
          false
        )?.resourceMethods || []
      ).includes('PUT');
    },

    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },

    menuItems() {
      const items = [
        {
          key:   'home',
          icon:  () => h(HomeOutlined),
          label: this.t('nav.home'),
          to:    { name: 'home' },
        },
        {
          key:   'llmos-cluster',
          icon:  () => h(IconOrSvg, { icon: 'icon-cluster' }),
          label: this.t('product.llmos'),
          to:    {
            name:   'c-cluster-product-resource',
            params: {
              product:  'llmos',
              cluster:  'local',
              resource: 'node'
            }
          },
        },
      ];

      // 只有当llmos-agent插件存在且启用时才显示Apps菜单
      if (this.showAppsMenu) {
        items.push({
          key:   'llmos-apps',
          icon:  () => h(AppstoreOutlined),
          label: h('span', [
            h('span', this.t('product.apps')),
            h(Tag, {
              color: 'warning',
              class: 'ml-5',
            }, () => this.t('generic.alpha'))
          ]),
          to: {
            name:   'c-cluster-apps-manage',
            params: { cluster: 'local' }
          },
        });
      }

      // 添加剩余的菜单项
      items.push(
        {
          key:   'user-auth',
          icon:  () => h(UsergroupAddOutlined),
          label: this.t('product.auth', {}, true),
          to:    {
            name:   'c-cluster-product-resource',
            params: {
              cluster:  'local',
              product:  'auth',
              resource: 'management.llmos.ai.user'
            }
          },
        },
        {
          key:      'settings',
          icon:     () => h(SettingOutlined),
          label:    this.t('product.settings'),
          children: [
            {
              key:      'preferences',
              icon:     () => h(ControlOutlined),
              label:    this.t('nav.userMenu.preferences'),
              to:       { name: 'prefs' },
              disabled: !this.showPreferencesLink,
            },
            {
              key:   'account-api-key',
              icon:  () => h(UsergroupAddOutlined),
              label: this.t('nav.userMenu.accountAndKeys', {}, true),
              to:    { name: 'account' },
            }, {
              key:   'global-settings',
              icon:  () => h(SettingOutlined),
              label: this.t('product.globalSettings'),
              to:    {
                name:   'c-cluster-settings',
                params: { cluster: 'local' }
              }
            },
          ]
        }
      );

      return items;
    },

    globalBannerSettings() {
      const settings = this.$store.getters['management/all'](
        MANAGEMENT.SETTING
      );
      const bannerSettings = settings?.find((s) => s.id === SETTING.BANNERS);

      if (bannerSettings) {
        const parsed = JSON.parse(bannerSettings.value);
        const {
          showFooter, showHeader, bannerFooter, bannerHeader
        } = parsed;

        return {
          headerFont:
            showHeader === 'true' ? this.pxToEm(bannerHeader.fontSize) : '0px',
          footerFont:
            showFooter === 'true' ? this.pxToEm(bannerFooter.fontSize) : '0px',
        };
      }

      return undefined;
    },

    showClusterSearch() {
      return this.clusters.length > this.maxClustersToShow;
    },

    clusters() {
      const kubeClusters = this.$store.getters['management/all'](
        MANAGEMENT.CLUSTER
      );

      return (
        kubeClusters?.map((x) => {
          return {
            id:              x.id,
            label:           x.nameDisplay,
            ready:           x.isReady,
            osLogo:          x.providerOsLogo,
            providerNavLogo: x.providerMenuLogo,
            llmNavLogo:      x.llmNavLogo,
            badge:           x.badge,
            isLocal:         x.isLocal,
            pinned:          x.pinned,
            pin:             () => x.pin(),
            unpin:           () => x.unpin(),
            clusterRoute:    {
              name:   'c-cluster-explorer',
              params: { cluster: x.id },

            },
            llmosRoute: { name: 'c-cluster-llmos', params: { cluster: x.id } },
          };
        }) || []
      );
    },

    clustersFiltered() {
      const search = (this.clusterFilter || '').toLowerCase();
      const out = search ? this.clusters.filter((item) => item.label?.toLowerCase().includes(search)
      ) : this.clusters;
      const sorted = sortBy(out, ['ready:desc', 'label']);

      if (search) {
        this.showPinClusters = false;
        this.searchActive = !sorted.length > 0;

        return sorted;
      }
      this.showPinClusters = true;
      this.searchActive = false;

      if (sorted.length >= this.maxClustersToShow) {
        const sortedPinOut = sorted
          .filter((item) => !item.pinned)
          .slice(0, this.maxClustersToShow);

        return sortedPinOut;
      } else {
        return sorted.filter((item) => !item.pinned);
      }
    },

    pinFiltered() {
      const out = this.clusters.filter((item) => item.pinned);
      const sorted = sortBy(out, ['ready:desc', 'label']);

      return sorted;
    },

    pinnedClustersHeight() {
      const pinCount = this.clusters.filter((item) => item.pinned).length;
      const height = pinCount > 2 ? pinCount * 43 : 90;

      return `min-height: ${ height }px`;
    },

    clusterFilterCount() {
      return this.clusterFilter ? this.clustersFiltered.length : this.clusters.length;
    },

    configurationApps() {
      const options = this.options;

      return options.filter((opt) => opt.category === 'configuration');
    },

    options() {
      const cluster = this.clusterId || this.$store.getters['defaultClusterId'];

      // TODO plugin routes
      const entries = this.$store.getters['type-map/activeProducts']?.map(
        (p) => {
          // Try product-specific index first
          const to = p.to || {
            name:   `c-cluster-${ p.name }`,
            params: { cluster },
          };

          const matched = this.$router
            .getRoutes()
            .filter((route) => route.name === to.name);

          if (!matched.length) {
            to.name = 'c-cluster-product';
            to.params.product = p.name;
          }

          return {
            label: this.$store.getters['i18n/withFallback'](
              `product."${ p.name }"`,
              null,
              ucFirst(p.name)
            ),
            icon:              `icon-${ p.icon || 'copy' }`,
            svg:               p.svg,
            value:             p.name,
            removable:         p.removable !== false,
            inStore:           p.inStore || 'cluster',
            weight:            p.weight || 1,
            category:          p.category || 'none',
            to,
            isMultiClusterApp: p.isMultiClusterApp,
          };
        }
      );

      return sortBy(entries, ['weight']);
    },

    canEditSettings() {
      return (
        this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)
          ?.resourceMethods || []
      ).includes('PUT');
    },

    appBar() {
      let activeFound = false;

      // order is important for the object keys here
      // since we want to check last pinFiltered and clustersFiltered
      const appBar = {
        configurationApps: this.configurationApps,
        pinFiltered:       this.pinFiltered,
        clustersFiltered:  this.clustersFiltered,
      };

      Object.keys(appBar).forEach((menuSection) => {
        const menuSectionItems = appBar[menuSection];
        const isClusterCheck =
          menuSection === 'pinFiltered' || menuSection === 'clustersFiltered';

        // need to reset active state on other menu items
        menuSectionItems.forEach((item) => {
          item.isMenuActive = false;
          item.isExplorerActive = false;

          if (!activeFound && this.checkActiveRoute(item, isClusterCheck)) {
            activeFound = true;
            item.isMenuActive = true;
          }

          if (this.isCurrRouteClusterExplorer) {
            activeFound = true;
            item.isMenuActive = false;
            item.isExplorerActive = true;
          }
        });
      });

      return appBar;
    },

    isCurrRouteClusterExplorer() {
      if (this.$route.name?.startsWith('c-cluster-explorer')) {
        return true;
      }
      const product = this.$route.params?.product;

      return this.$route?.name?.startsWith('c-cluster') && product === EXPLORER;
    },

    isCurrRouteClusterLLMOS() {
      return this.$route?.name?.startsWith('c-cluster');
    },

    productFromRoute() {
      return getProductFromRoute(this.$route);
    },

    // 获取所有managedaddon
    managedAddons() {
      return this.$store.getters['management/all'](MANAGEMENT.MANAGED_ADDON) || [];
    }
  },

  watch: {

    $route() {
      this.shown = false;
      this.updateSelectedKeys();
    },

    menuItems: {
      handler() {
        this.updateSelectedKeys();
      },
      immediate: true,
    },

    // 监听managedAddons的变化
    managedAddons: {
      handler() {
        // 当managedAddons变化时，重新检查agent插件状态
        this.checkAgentAddonStatus();
      },
      deep: true, // 深度监听对象内部变化
    },
  },

  methods: {
    // 检查llmos-agent插件状态
    async checkAgentAddonStatus() {
      try {
        // 首次加载时获取所有managedaddon
        if (!this.managedAddons.length) {
          await this.$store.dispatch('management/findAll', { type: MANAGEMENT.MANAGED_ADDON });
        }

        // 使用计算属性获取addons
        const addons = this.managedAddons;

        // 查找llmos-agent插件
        const agentAddon = addons.find((addon) => addon.metadata?.name === 'llmos-agents');

        // 如果插件不存在或未启用，不显示Apps菜单
        this.showAppsMenu = agentAddon && agentAddon.spec?.enabled;
      } catch (error) {
        this.showAppsMenu = false;
      }
    },

    onMenuClick({ item }) {
      if (item && item.to) {
        this.$router.push(item.to);
      }
    },

    goCluster() {
      const c = this.appBar.clustersFiltered[0];

      if (c.ready) {
        this.$router.push(c.llmosRoute);
      }
    },
    goConfig(a) {
      this.$router.push(a.to);
    },

    checkActiveRoute(obj, isClusterRoute) {
      // for Cluster links in main nav: check if route is a cluster with LLMOS + check if route cluster matches cluster obj id + check if curr product matches route product
      if (isClusterRoute) {
        return (
          this.isCurrRouteClusterLLMOS &&
          this.$route?.params?.cluster === obj?.id &&
          this.productFromRoute === this.currentProduct?.name
        );
      }

      // for remaining main nav items, check if curr product matches route product is enough
      return this.productFromRoute === obj?.value;
    },

    updateSelectedKeys() {
      const isParamsMatch = (itemParams = {}, routeParams = {}) => {
        const itemKeys = Object.keys(itemParams);

        return itemKeys.every(
          (key) => itemParams[key] === routeParams[key]
        );
      };

      const isRouteMatch = (item, route) => {
        if (!item.to) return false;

        if (item.to.name === route.name) {
          if (!item.to.params) return true;

          return isParamsMatch(item.to.params, route.params);
        }

        if (item.to.name && route.name) {
          try {
            const itemRoute = this.$router.resolve(item.to);
            const currentPath = route.path;
            const itemPath = itemRoute.path;

            if (currentPath.startsWith(itemPath) || itemPath.startsWith(currentPath)) {
              return isParamsMatch(item.to.params || {}, route.params);
            }
          } catch (e) {
            return false;
          }
        }

        return false;
      };

      const findKeyByRoute = (items) => {
        for (const item of items) {
          if (isRouteMatch(item, this.$route)) {
            return item.key;
          }

          if (item.children) {
            const childKey = findKeyByRoute(item.children);

            if (childKey) return childKey;
          }
        }

        return null;
      };

      const key = findKeyByRoute(this.menuItems);

      this.selectedKeys = key ? [key] : this.selectedKeys;
    }
  },
};
</script>

<template>
  <div>
    <a-menu
      :selectedKeys="selectedKeys"
      mode="horizontal"
      :items="menuItems"
      class="!bg-[#fafafa]"
      @click="onMenuClick"
    />
  </div>
</template>
