import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { MANAGEMENT } from '@shell/config/types';
import { NAME as AUTH } from '@shell/config/product/auth';

const interopDefault = (promise) => promise.then((page) => page.default || page);

export default [
  {
    path:      '/',
    component: () => interopDefault(import('@shell/pages/index.vue')),
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/',
        component: () => interopDefault(import('@shell/pages/index.vue')),
        name:      'index',
      },
    ],
  },
  {
    path:      '/fail-whale',
    component: () => interopDefault(import('@shell/pages/fail-whale.vue')),
    name:      'fail-whale',
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/blank.vue')),
    name:      'blank',
    meta:      { requiresAuthentication: true },
    children:  [],
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/home.vue')),
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/home',
        component: () => interopDefault(import('@shell/pages/home.vue')),
        name:      'home',
      },
      {
        path:      '/support',
        component: () => interopDefault(import('@shell/pages/support/index.vue')),
        name:      'support',
      },
    ],
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/plain.vue')),
    name:      'plain',
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/about',
        component: () => interopDefault(import('@shell/pages/about.vue')),
        name:      'about',
      },
      {
        path:      '/prefs',
        component: () => interopDefault(import('@shell/pages/prefs.vue')),
        name:      'prefs',
      },
      {
        path:      '/account',
        component: () => interopDefault(import('@shell/pages/account/index.vue')),
        name:      'account',
      },
      {
        path:      '/account/create-key',
        component: () => interopDefault(import('@shell/pages/account/create-key.vue')),
        name:      'account-create-key',
      },
      {
        path: '/c/:cluster/auth',
        redirect(to) {
          return {
            name:   'c-cluster-product-resource',
            params: {
              ...(to?.params || {}),
              product:  AUTH,
              resource: MANAGEMENT.USER,
            },
          };
        },
        name: 'c-cluster-auth',
      },
      {
        path:      '/c/:cluster/settings',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/index.vue')),
        name:      'c-cluster-settings',
      },
    ],
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/standalone.vue')),
    name:      'standalone',
    children:  [],
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/unauthenticated.vue')),
    name:      'unauthenticated',
    children:  [
      {
        path:      '/auth/login',
        component: () => interopDefault(import('@shell/pages/auth/login.vue')),
        name:      'auth-login',
      },
      {
        path:      '/auth/logout',
        component: () => interopDefault(import('@shell/pages/auth/logout.vue')),
        name:      'auth-logout',
      },
      {
        path:      '/auth/setup',
        component: () => interopDefault(import('@shell/pages/auth/setup.vue')),
        name:      'auth-setup',
      },
    ],
  },
  {
    path:      '/',
    component: () => interopDefault(import('@shell/components/templates/default.vue')),
    name:      'default',
    meta:      { requiresAuthentication: true },
    children:  [
      {
        path:      '/clusters',
        component: () => interopDefault(import('@shell/pages/clusters/index.vue')),
        name:      'clusters',
      },
      {
        path: '/c/:cluster',
        name: 'c-cluster',
        redirect(to) {
          return {
            name:   'c-cluster-explorer',
            params: {
              ...(to?.params || {}),
              product: EXPLORER,
            },
          };
        },
      },
      {
        path:      '/c/:cluster/explorer',
        component: () => interopDefault(import('@shell/pages/c/_cluster/explorer/index.vue')),
        name:      'c-cluster-explorer',
      },
      {
        path:      '/c/:cluster/apps/appManage',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/appManage/index.vue')),
        name:      'c-cluster-apps-manage',
        meta:      { product: 'apps' }
      },
      {
        path:      '/c/:cluster/apps/dataCenter',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/dataCenter/index.vue')),
        name:      'c-cluster-apps-dataCenter',
        meta:      { product: 'apps' }
      },
      {
        path:      '/c/:cluster/apps/knowledgeBase',
        component: () => interopDefault(import('@shell/pages/c/_cluster/apps/knowledgeBase/index.vue')),
        name:      'c-cluster-apps-knowledgeBase',
        meta:      { product: 'apps' }
      },
      {
        path:      '/c/:cluster/llmos/tools',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/llmos/tools/index.vue')
        ),
        name: 'c-cluster-llmos-tools',
      },
      {
        path:      '/c/:cluster/llmos',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/llmos/index.vue' /* webpackChunkName: "pages/c/_cluster/llm/index" */
          )
        ),
        name: 'c-cluster-llmos',
      },
      {
        path:      `/c/:cluster/:product/:resource/:namespace/:id/rayDashboard`,
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/rayDashboard/index.vue' /* webpackChunkName: "pages/c/_cluster/rayDashboard/index" */
          )
        ),
        name: `c-cluster-product-resource-namespace-id-rayDashboard`,
      },
      {
        path:      '/c/:cluster/auth/roles',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/auth/roles/index.vue')
        ),
        name: 'c-cluster-auth-roles',
      },
      {
        path:      '/c/:cluster/explorer/explorer-utils',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/explorer/explorer-utils.js')
        ),
        name: 'c-cluster-explorer-explorer-utils',
      },
      {
        path:      '/c/:cluster/monitoring/alertmanagerconfig',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue'
          )
        ),
        name: 'c-cluster-monitoring-alertmanagerconfig',
      },
      {
        path:      '/c/:cluster/monitoring/monitor',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/monitoring/monitor/index.vue')
        ),
        name: 'c-cluster-monitoring-monitor',
      },
      {
        path:      '/c/:cluster/settings/brand',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/brand.vue')),
        name:      'c-cluster-settings-brand',
      },
      {
        path:      '/c/:cluster/settings/DefaultLinksEditor',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/settings/DefaultLinksEditor.vue')
        ),
        name: 'c-cluster-settings-DefaultLinksEditor',
      },
      {
        path:      '/c/:cluster/settings/links',
        component: () => interopDefault(import('@shell/pages/c/_cluster/settings/links.vue')),
        name:      'c-cluster-settings-links',
      },
      {
        path:      '/c/:cluster/monitoring/monitor/create',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/monitoring/monitor/create.vue')
        ),
        name: 'c-cluster-monitoring-monitor-create',
      },
      {
        path:      '/c/:cluster/monitoring',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/monitoring/index.vue')
        ),
        name: 'c-cluster-monitoring',
      },
      {
        path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue'
          )
        ),
        name: 'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid',
      },
      {
        path:      '/c/:cluster/auth/roles/:resource/create',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/auth/roles/_resource/create.vue')
        ),
        name: 'c-cluster-auth-roles-resource-create',
      },
      {
        path:      '/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue'
          )
        ),
        name: 'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
      },
      {
        path:      '/c/:cluster/auth/roles/:resource/:id?',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/auth/roles/_resource/_id.vue')
        ),
        name: 'c-cluster-auth-roles-resource-id',
      },
      {
        path:      '/c/:cluster/monitoring/monitor/:namespace/:id?',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue'
          )
        ),
        name: 'c-cluster-monitoring-monitor-namespace-id',
      },
      {
        path:      '/c/:cluster/navlinks/:group?',
        component: () => interopDefault(import('@shell/pages/c/_cluster/navlinks/_group.vue')),
        name:      'c-cluster-navlinks-group',
      },
      {
        path:      '/c/:cluster/:product',
        component: () => interopDefault(import('@shell/pages/c/_cluster/_product/index.vue')),
        name:      'c-cluster-product',
      },
      {
        path:      '/c/:cluster/:product/namespaces',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/_product/namespaces.vue')
        ),
        name: 'c-cluster-product-namespaces',
      },
      {
        path:      '/c/:cluster/:product/:resource',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/_product/_resource/index.vue')
        ),
        name: 'c-cluster-product-resource',
      },
      {
        path:      '/c/:cluster/:product/:resource/create',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/_product/_resource/create.vue')
        ),
        name: 'c-cluster-product-resource-create',
      },
      {
        path:      '/c/:cluster/:product/:resource/:id',
        component: () => interopDefault(
          import('@shell/pages/c/_cluster/_product/_resource/_id.vue')
        ),
        name: 'c-cluster-product-resource-id',
      },
      {
        path:      '/c/:cluster/:product/:resource/:namespace/:id',
        component: () => interopDefault(
          import(
            '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue'
          )
        ),
        name: 'c-cluster-product-resource-namespace-id',
      },
    ],
  },
  {
    path:      '/:catchAll(.*)*',
    name:      '404',
    component: () => interopDefault(import('@shell/pages/404.vue')),
    meta:      { requiresAuthentication: true },
  },
];
