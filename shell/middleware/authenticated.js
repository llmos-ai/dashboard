import { NAME as EXPLORER } from '@shell/config/product/explorer';
import {
  TIMED_OUT, UPGRADED, _FLAGGED, _UNFLAG
} from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';
import { applyProducts } from '@shell/store/type-map';
import { ClusterNotFoundError, RedirectToError } from '@shell/utils/error';
import { get } from '@shell/utils/object';
import { setFavIcon, haveSetFavIcon } from '@shell/utils/favicon';
import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';
import { AFTER_LOGIN_ROUTE } from '@shell/store/prefs';
import { BACK_TO } from '@shell/config/local-storage';
import { canViewResource } from '@shell/utils/auth';

const getPackageFromRoute = (route) => {
  if (!route?.meta) {
    return;
  }
  // Sometimes meta is an array... sometimes not
  const arraySafe = Array.isArray(route.meta) ? route.meta : [route.meta];

  return arraySafe.find((m) => !!m.pkg)?.pkg;
};

const getResourceFromRoute = (to) => {
  return to.params?.resource;
};

let beforeEachSetup = false;

function findMeta(route, key) {
  if (route?.meta) {
    const meta = Array.isArray(route.meta) ? route.meta : [route.meta];

    for (let i = 0; i < meta.length; i++) {
      if (meta[i][key]) {
        return meta[i][key];
      }
    }
  }

  return undefined;
}

export function getClusterFromRoute(to) {
  let cluster = to.params?.cluster;

  if (!cluster) {
    cluster = findMeta(to, 'cluster');
  }

  return cluster;
}

export function getProductFromRoute(to) {
  let product = to.params?.product;

  if ( !product ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      product = match[1];
    }
  }

  // If still no product, see if the route indicates the product via route metadata
  if (!product) {
    product = findMeta(to, 'product');
  }

  return product;
}

function setProduct(store, to, redirect) {
  let product = getProductFromRoute(to);

  // since all products are hardcoded as routes (ex: c-local-explorer), if we match the wildcard route it means that the product does not exist
  if ((product && (!to.matched.length || (to.matched.length && to.matched[0].path === '/c/:cluster/:product'))) ||
  // if the product grabbed from the route is not registered, then we don't have it!
  (product && !store.getters['type-map/isProductRegistered'](product))) {
    store.dispatch('loadingError', new Error(store.getters['i18n/t']('nav.failWhale.productNotFound', { productNotFound: product }, true)));

    return () => redirect(302, '/fail-whale');
  }

  if ( !product ) {
    product = EXPLORER;
  }

  const oldProduct = store.getters['productId'];

  if ( product !== oldProduct ) {
    store.commit('setProduct', product);
  }

  return false;
}

/**
 * Check that the resource is valid, if not redirect to fail whale
 *
 * This requires that
 * - product is set
 * - product's store is set and setup (so we can check schema's within it)
 * - product's store has the schemaFor getter (extension stores might not have it)
 * - there's a resource associated with route (meta or param)
 */
function invalidResource(store, to, redirect) {
  const product = store.getters['currentProduct'];
  const resource = getResourceFromRoute(to);

  // In order to check a resource is valid we need these
  if (!product || !resource) {
    return false;
  }

  if (canViewResource(store, resource)) {
    return false;
  }

  // Unknown resource, redirect to fail whale

  store.dispatch('loadingError', new Error(store.getters['i18n/t']('nav.failWhale.resourceNotFound', { resource }, true)));

  return () => redirect(302, '/fail-whale');
}

export default async function({
  route, app, store, redirect, $cookies, req, isDev, from, $plugin, next
}) {
  if (route.path && typeof route.path === 'string') {
    // Ignore webpack hot module reload requests
    if (route.path.startsWith('/__webpack_hmr/')) {
      return;
    }

    // Ignore the error page
    if (route.path.startsWith('/fail-whale')) {
      return;
    }
  }

  const upgraded = route.query[UPGRADED] === _FLAGGED;

  if (upgraded) {
    app.router.applyQuery({[UPGRADED]: _UNFLAG});

    store.dispatch('growl/success', {
      title: store.getters['i18n/t']('serverUpgrade.title'),
      message: store.getters['i18n/t']('serverUpgrade.message'),
      timeout: 0,
    });
  }

  try {
    // Load settings, which will either be just the public ones if not logged in, or all if you are
    await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt: {
        load: _ALL_IF_AUTHED, url: `/v1/${MANAGEMENT.SETTING}`, redirectUnauthorized: false
      }
    });

    // Set the favicon - use custom one from store if set
    if (!haveSetFavIcon()) {
      setFavIcon(store);
    }
  } catch (e) {
    console.error('Error loading authenticated settings', e);
  }

  // Make sure you're actually logged in
  function isLoggedIn(me) {
    store.commit('auth/hasAuth', true);
    store.commit('auth/loggedInAs', me.id);
  }

  function notLoggedIn() {
    store.commit('auth/hasAuth', true);

    if ( route.name === 'index' ) {
      return redirect(302, '/auth/login');
    } else {
      return redirect(302, `/auth/login?${ TIMED_OUT }`);
    }
  }

  function noAuth() {
    store.commit('auth/hasAuth', false);
  }

  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    // `await` so we have one successfully request whilst possibly logged in
    await store.dispatch('auth/getUser');

    try {
      const me = await findMe(store);
      isLoggedIn(me);
    } catch (e) {
      const status = e?._status;
      if ( status === 404 ) {
        noAuth();
      } else {
        if ( status === 401 ) {
          notLoggedIn();
        } else {
          store.commit('setError', { error: e, locationError: new Error('Auth Middleware') });
        }
        return;
      }
    }
  }

  const backTo = window.localStorage.getItem(BACK_TO);

  if (backTo) {
    window.localStorage.removeItem(BACK_TO);

    window.location.href = backTo;
  }

  // Load stuff
  let localCheckResource = false;

  await applyProducts(store, $plugin);

  // Setup a beforeEach hook once to keep track of the current product
  if ( !beforeEachSetup ) {
    beforeEachSetup = true;
    // This only needs to happen when beforeEach hook hasn't run (the initial load)
    localCheckResource = true;

    store.app.router.beforeEach((to, from, next) => {
      // NOTE - This beforeEach runs AFTER this middleware. So anything in this middleware that requires it must set it manually
      let redirected = setProduct(store, to, redirect);

      if (redirected) {
        return redirected();
      }

      redirected = invalidResource(store, to, redirect);

      if (redirected) {
        return redirected();
      }

      next();
    });

    // Call it for the initial pageload
    const redirected = setProduct(store, route, redirect);

    if (redirected) {
      return redirected();
    }

    store.app.router.afterEach((to, from) => {
      // Clear state used to record if back button was used for navigation
      setTimeout(() => {
        window._popStateDetected = false;
      }, 1);
    });
  }

  try {
    let clusterId = get(route, 'params.cluster');

    // Route can provide cluster ID via metadata
    if (!clusterId && route) {
      clusterId = getClusterFromRoute(route);
    }

    const pkg = getPackageFromRoute(route);
    const product = getProductFromRoute(route);

    // Sometimes this needs to happen before or alongside other things... but is always needed
    const always = [
      store.dispatch('loadManagement')
    ];

    // Entering a new package where we weren't before?
    const newPkgPlugin = pkg ? Object.values($plugin.getPlugins()).find((p) => p.name === pkg) : null;

    if (!route.matched?.length) {
      // If there are no matching routes we could be trying to nav to a page belonging to a dynamic plugin which needs loading
      await Promise.all([
        ...always,
      ]);

      // If a plugin claims the route and is loaded correctly we'll get a route back
      const newLocation = await dynamicPluginLoader.check({ route, store });

      // If we have a new location, double check that it's actually valid
      const resolvedRoute = newLocation ? store.app.router.resolve(newLocation) : null;

      if (resolvedRoute?.route.matched.length) {
        // Note - don't use `redirect` or `store.app.route` (breaks feature by failing to run middleware in default layout)
        return next(newLocation);
      }
    }

    // Always run loadCluster, it handles 'unload' as well
    // Run them in parallel
    await Promise.all([
      ...always,
      store.dispatch('loadCluster', {
        id:          clusterId,
        newPkg:      newPkgPlugin,
        product,
        targetRoute: route
      })
    ]);

    if (localCheckResource) {
      const redirected = invalidResource(store, route, redirect);

      if (redirected) {
        return redirected();
      }
    }

    if (!clusterId) {
      clusterId = store.getters['defaultClusterId']; // This needs the cluster list, so no parallel
      const isSingleProduct = store.getters['isSingleProduct'];

      if (isSingleProduct?.afterLoginRoute) {
        const value = {
          name:   'c-cluster-product',
          ...isSingleProduct.afterLoginRoute,
          params: {
            cluster: clusterId,
            ...isSingleProduct.afterLoginRoute?.params
          },
        };

        await store.dispatch('prefs/set', {
          key: AFTER_LOGIN_ROUTE,
          value,
        });
      }
    }
  } catch (e) {
    if ( e.name === ClusterNotFoundError.name ) {
      return redirect(302, '/home');
    } if ( e.name === RedirectToError.name ) {
      return redirect(302, e.url);
    } else {
      // Sets error 500 if lost connection to API
      store.commit('setError', { error: e, locationError: new Error(store.getters['i18n/t']('nav.failWhale.authMiddleware')) });

      return redirect(302, '/fail-whale');
    }
  }
}

async function findMe(store) {
  return store.getters['auth/user']
}
