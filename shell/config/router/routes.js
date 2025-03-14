import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { MANAGEMENT, BACKUP_RESTORE, CIS } from '@shell/config/types';
import { NAME as AUTH } from '@shell/config/product/auth';

import { installRedirectRouteMeta } from '@shell/config/router/navigation-guards/install-redirect';
import { NAME as MONITORING_NAME } from '@shell/config/product/monitoring';

const interopDefault = (promise) =>
  promise.then((page) => page.default || page);

// export default [{
//   path:      '/about',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/about.vue' /* webpackChunkName: "pages/about" */)),
//   name:      'about'
// }, {
//   path:      '/account',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/account/index.vue' /* webpackChunkName: "pages/account/index" */)),
//   name:      'account'
// }, {
//   path:      '/account/create-key',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/account/create-key.vue' /* webpackChunkName: "pages/account/create-key" */)),
//   name:      'account-create-key'
// }, {
//   path:      '/c',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/c/index.vue' /* webpackChunkName: "pages/c/index" */)),
//   name:      'c'
// }, {
//   path:      '/clusters',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/clusters/index.vue' /* webpackChunkName: "pages/clusters/index" */)),
//   name:      'clusters'
// }, {
//   path:      '/fail-whale',
//   component: () => interopDefault(import('@shell/pages/fail-whale.vue' /* webpackChunkName: "pages/fail-whale" */)),
//   name:      'fail-whale'
// }, {
//   path:      '/home',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/home.vue' /* webpackChunkName: "pages/home" */)),
//   name:      'home'
// }, {
//   path:      '/prefs',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/prefs.vue' /* webpackChunkName: "pages/prefs" */)),
//   name:      'prefs'
// }, {
//   path:      '/support',
//   meta:      { requiresAuthentication: true },
//   component: () => interopDefault(import('@shell/pages/support/index.vue' /* webpackChunkName: "pages/support/index" */)),
//   name:      'support'
// }, {
//   path:      '/auth/login',
//   component: () => interopDefault(import('@shell/pages/auth/login.vue' /* webpackChunkName: "pages/auth/login" */)),
//   name:      'auth-login'
// }, {
//   path:      '/auth/logout',
//   component: () => interopDefault(import('@shell/pages/auth/logout.vue' /* webpackChunkName: "pages/auth/logout" */)),
//   name:      'auth-logout'
// }, {
//   path:      '/auth/setup',
//   component: () => interopDefault(import('@shell/pages/auth/setup.vue' /* webpackChunkName: "pages/auth/setup" */)),
//   name:      'auth-setup'
// }, {
//   path:      '/c/:cluster',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/index.vue' /* webpackChunkName: "pages/c/_cluster/index" */)),
//   name:      'c-cluster'
// }, {
//   path:      '/c/:cluster/auth',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/auth/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/index" */)),
//   name:      'c-cluster-auth'
// }, {
//   path:      '/c/:cluster/auth/roles',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/index" */)),
//   name:      'c-cluster-auth-roles'
// }, {
//   path:      '/c/:cluster/auth/roles/:resource/create',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/create" */)),
//   name:      'c-cluster-auth-roles-resource-create'
// }, {
//   path:      '/c/:cluster/auth/roles/:resource/:id?',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/auth/roles/_resource/_id" */)),
//   name:      'c-cluster-auth-roles-resource-id'
// }, {
//   path:      '/c/:cluster/explorer',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "pages/c/_cluster/explorer/index" */)),
//   name:      'c-cluster-explorer'
// }, {
//   path:      '/c/:cluster/llmos',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/llmos/index.vue' /* webpackChunkName: "pages/c/_cluster/llm/index" */)),
//   name:      'c-cluster-llmos'
// }, {
//   path:      '/c/:cluster/monitoring',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "pages/c/_cluster/monitoring/index" */)),
//   name:      'c-cluster-monitoring'
// }, {
//   path:      '/c/:cluster/settings',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/settings/index.vue' /* webpackChunkName: "pages/c/_cluster/settings/index" */)),
//   name:      'c-cluster-settings'
// }, {
//   path:      '/c/:cluster/llmos/tools',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/llmos/tools/index.vue')),
//   name:      'c-cluster-llmos-tools'
// }, {
//   path:      '/c/:cluster/explorer/EventsTable',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/EventsTable.vue' /* webpackChunkName: "pages/c/_cluster/explorer/EventsTable" */)),
//   name:      'c-cluster-explorer-EventsTable'
// }, {
//   path:      '/c/:cluster/explorer/explorer-utils',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/explorer-utils.js' /* webpackChunkName: "pages/c/_cluster/explorer/explorer-utils" */)),
//   name:      'c-cluster-explorer-explorer-utils'
// }, {
//   path:      '/c/:cluster/settings/brand',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "pages/c/_cluster/settings/brand" */)),
//   name:      'c-cluster-settings-brand'
// }, {
//   path:      '/c/:cluster/settings/DefaultLinksEditor',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/settings/DefaultLinksEditor.vue' /* webpackChunkName: "pages/c/_cluster/settings/DefaultLinksEditor" */)),
//   name:      'c-cluster-settings-DefaultLinksEditor'
// }, {
//   path:      '/c/:cluster/settings/links',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/settings/links.vue' /* webpackChunkName: "pages/c/_cluster/settings/links" */)),
//   name:      'c-cluster-settings-links'
// }, {
//   path:      '/c/:cluster/navlinks/:group?',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "pages/c/_cluster/navlinks/_group" */)),
//   name:      'c-cluster-navlinks-group'
// }, {
//   path:      '/c/:cluster/monitoring/alertmanagerconfig',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue')),
//   name:      'c-cluster-monitoring-alertmanagerconfig'
// }, {
//   path:      '/c/:cluster/monitoring/monitor',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/index.vue')),
//   name:      'c-cluster-monitoring-monitor'
// }, {
//   path:      '/c/:cluster/monitoring/monitor/create',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/create.vue')),
//   name:      'c-cluster-monitoring-monitor-create'
// }, {
//   path:      '/c/:cluster/monitoring/monitor/:namespace/:id?',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue')),
//   name:      'c-cluster-monitoring-monitor-namespace-id'
// }, {
//   path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue')),
//   name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid'
// }, {
//   path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue')),
//   name:      'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver'
// }, {
//   path:      '/c/:cluster/:product',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/index" */)),
//   name:      'c-cluster-product'
// }, {
//   path:      '/c/:cluster/:product/namespaces',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "pages/c/_cluster/_product/namespaces" */)),
//   name:      'c-cluster-product-namespaces'
// }, {
//   path:      '/c/:cluster/:product/:resource',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/index" */)),
//   name:      'c-cluster-product-resource'
// }, {
//   path:      '/c/:cluster/:product/:resource/create',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/create" */)),
//   name:      'c-cluster-product-resource-create'
// }, {
//   path:      '/c/:cluster/:product/:resource/:id',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_id" */)),
//   name:      'c-cluster-product-resource-id'
// }, {
//   path:      `/c/:cluster/:product/:resource/:namespace/:id/rayDashboard`,
//   component: () => interopDefault(import('@shell/pages/c/_cluster/rayDashboard/index.vue' /* webpackChunkName: "pages/c/_cluster/rayDashboard/index" */)),
//   name:      `c-cluster-product-resource-namespace-id-rayDashboard`,
// }, {
//   path:      '/c/:cluster/:product/:resource/:namespace/:id?',
//   component: () => interopDefault(import('@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "pages/c/_cluster/_product/_resource/_namespace/_id" */)),
//   name:      'c-cluster-product-resource-namespace-id'
// }, {
//   path:      '/',
//   component: () => interopDefault(import('@shell/pages/index.vue' /* webpackChunkName: "pages/index" */)),
//   name:      'index'
// }];

export default [
  {
    path: '/',
    component: () => interopDefault(import('@shell/pages/index.vue')),
    meta: { requiresAuthentication: true },
    children: [
      {
        path: '/',
        component: () => interopDefault(import('@shell/pages/index.vue')),
        name: 'index',
      },
    ],
  },
  {
    path: '/fail-whale',
    component: () => interopDefault(import('@shell/pages/fail-whale.vue')),
    name: 'fail-whale',
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/blank.vue')),
    name: 'blank',
    meta: { requiresAuthentication: true },
    children: [],
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/home.vue')),
    meta: { requiresAuthentication: true },
    children: [
      {
        path: '/home',
        component: () => interopDefault(import('@shell/pages/home.vue')),
        name: 'home',
      },
      {
        path: '/support',
        component: () =>
          interopDefault(import('@shell/pages/support/index.vue')),
        name: 'support',
      },
    ],
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/plain.vue')),
    name: 'plain',
    meta: { requiresAuthentication: true },
    children: [
      {
        path: '/about',
        component: () => interopDefault(import('@shell/pages/about.vue')),
        name: 'about',
      },
      {
        path: '/prefs',
        component: () => interopDefault(import('@shell/pages/prefs.vue')),
        name: 'prefs',
      },
      {
        path: '/account',
        component: () =>
          interopDefault(import('@shell/pages/account/index.vue')),
        name: 'account',
      },
      {
        path: '/account/create-key',
        component: () =>
          interopDefault(import('@shell/pages/account/create-key.vue')),
        name: 'account-create-key',
      },
      {
        path: '/c/:cluster/auth',
        redirect(to) {
          return {
            name: 'c-cluster-product-resource',
            params: {
              ...(to?.params || {}),
              product: AUTH,
              resource: MANAGEMENT.USER,
            },
          };
        },
        name: 'c-cluster-auth',
      },
      {
        path: '/c/:cluster/settings',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/settings/index.vue')),
        name: 'c-cluster-settings',
      },
    ],
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/standalone.vue')),
    name: 'standalone',
    children: [],
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/unauthenticated.vue')),
    name: 'unauthenticated',
    children: [
      {
        path: '/auth/login',
        component: () => interopDefault(import('@shell/pages/auth/login.vue')),
        name: 'auth-login',
      },
      {
        path: '/auth/logout',
        component: () => interopDefault(import('@shell/pages/auth/logout.vue')),
        name: 'auth-logout',
      },
      {
        path: '/auth/setup',
        component: () => interopDefault(import('@shell/pages/auth/setup.vue')),
        name: 'auth-setup',
      },
    ],
  },
  {
    path: '/',
    component: () =>
      interopDefault(import('@shell/components/templates/default.vue')),
    name: 'default',
    meta: { requiresAuthentication: true },
    children: [
      {
        path: '/clusters',
        component: () =>
          interopDefault(import('@shell/pages/clusters/index.vue')),
        name: 'clusters',
      },
      {
        path: '/c/:cluster',
        name: 'c-cluster',
        redirect(to) {
          return {
            name: 'c-cluster-explorer',
            params: {
              ...(to?.params || {}),
              product: EXPLORER,
            },
          };
        },
      },
      {
        path: '/c/:cluster/explorer',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/explorer/index.vue')),
        name: 'c-cluster-explorer',
      },
      {
        path: '/c/:cluster/llmos',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/llmos/index.vue' /* webpackChunkName: "pages/c/_cluster/llm/index" */
            )
          ),
        name: 'c-cluster-llmos',
      },
      {
        path: `/c/:cluster/:product/:resource/:namespace/:id/rayDashboard`,
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/rayDashboard/index.vue' /* webpackChunkName: "pages/c/_cluster/rayDashboard/index" */
            )
          ),
        name: `c-cluster-product-resource-namespace-id-rayDashboard`,
      },
      {
        path: '/c/:cluster/llmos/tools',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/llmos/tools/index.vue')
          ),
        name: 'c-cluster-llmos-tools',
      },
      {
        path: '/c/:cluster/auth/roles',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/auth/roles/index.vue')
          ),
        name: 'c-cluster-auth-roles',
      },
      {
        path: '/c/:cluster/explorer/explorer-utils',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/explorer/explorer-utils.js')
          ),
        name: 'c-cluster-explorer-explorer-utils',
      },
      {
        path: '/c/:cluster/monitoring/alertmanagerconfig',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue'
            )
          ),
        name: 'c-cluster-monitoring-alertmanagerconfig',
      },
      {
        path: '/c/:cluster/monitoring/monitor',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/monitoring/monitor/index.vue')
          ),
        name: 'c-cluster-monitoring-monitor',
      },
      {
        path: '/c/:cluster/settings/brand',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/settings/brand.vue')),
        name: 'c-cluster-settings-brand',
      },
      {
        path: '/c/:cluster/settings/DefaultLinksEditor',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/settings/DefaultLinksEditor.vue')
          ),
        name: 'c-cluster-settings-DefaultLinksEditor',
      },
      {
        path: '/c/:cluster/settings/links',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/settings/links.vue')),
        name: 'c-cluster-settings-links',
      },
      {
        path: '/c/:cluster/monitoring/monitor/create',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/monitoring/monitor/create.vue')
          ),
        name: 'c-cluster-monitoring-monitor-create',
      },
      {
        path: '/c/:cluster/monitoring',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/monitoring/index.vue')
          ),
        name: 'c-cluster-monitoring',
      },
      {
        path: '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue'
            )
          ),
        name: 'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid',
      },
      {
        path: '/c/:cluster/auth/roles/:resource/create',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/auth/roles/_resource/create.vue')
          ),
        name: 'c-cluster-auth-roles-resource-create',
      },
      {
        path: '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue'
            )
          ),
        name: 'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
      },
      {
        path: '/c/:cluster/auth/roles/:resource/:id?',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/auth/roles/_resource/_id.vue')
          ),
        name: 'c-cluster-auth-roles-resource-id',
      },
      {
        path: '/c/:cluster/monitoring/monitor/:namespace/:id?',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue'
            )
          ),
        name: 'c-cluster-monitoring-monitor-namespace-id',
      },
      {
        path: '/c/:cluster/navlinks/:group?',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/navlinks/_group.vue')),
        name: 'c-cluster-navlinks-group',
      },
      {
        path: '/c/:cluster/:product',
        component: () =>
          interopDefault(import('@shell/pages/c/_cluster/_product/index.vue')),
        name: 'c-cluster-product',
      },
      {
        path: '/c/:cluster/:product/namespaces',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/_product/namespaces.vue')
          ),
        name: 'c-cluster-product-namespaces',
      },
      {
        path: '/c/:cluster/:product/:resource',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/_product/_resource/index.vue')
          ),
        name: 'c-cluster-product-resource',
      },
      {
        path: '/c/:cluster/:product/:resource/create',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/_product/_resource/create.vue')
          ),
        name: 'c-cluster-product-resource-create',
      },
      {
        path: '/c/:cluster/:product/:resource/:id',
        component: () =>
          interopDefault(
            import('@shell/pages/c/_cluster/_product/_resource/_id.vue')
          ),
        name: 'c-cluster-product-resource-id',
      },
      {
        path: '/c/:cluster/:product/:resource/:namespace/:id',
        component: () =>
          interopDefault(
            import(
              '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue'
            )
          ),
        name: 'c-cluster-product-resource-namespace-id',
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: '404',
    component: () => interopDefault(import('@shell/pages/404.vue')),
    meta: { requiresAuthentication: true },
  },
];
