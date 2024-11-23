import { allHash } from '@shell/utils/promise';
import { getProductFromRoute, getResourceFromRoute } from '@shell/utils/router';
import { NAME as LLMOS } from '@shell/config/product/llmos';
import { TIMED_OUT } from '@shell/config/query-params';

export const checkSchemasForFindAllHash = (types, store) => {
  const hash = {};

  for (const [key, value] of Object.entries(types)) {
    const schema = store.getters[`${ value.inStoreType }/schemaFor`](value.type);

    // It could be that user has permissions for GET but not list
    // e.g. Standard user with GitRepo permissions try to fetch list of fleetworkspaces
    // user has ability to GET but not fleet workspaces
    // so optionally define a function that require it to pass before /findAll
    const validSchema = value.schemaValidator ? value.schemaValidator(schema) : !!schema;

    if (validSchema) {
      hash[key] = store.dispatch(`${ value.inStoreType }/findAll`, { type: value.type } );
    }
  }

  return allHash(hash);
};

export const canViewResource = (store, resource) => {
  // Note - don't use the current products store... because products can override stores for resources with `typeStoreMap`
  const inStore = store.getters['currentStore'](resource);
  // There's a chance we're in an extension's product who's store could be anything, so confirm schemaFor exists
  const schemaFor = store.getters[`${ inStore }/schemaFor`];

  // In order to check a resource is valid we need these
  if (!inStore || !schemaFor) {
    return false;
  }

  // Resource is valid if a schema exists for it (standard resource, spoofed resource) or it's a virtual resource
  const validResource = schemaFor(resource) || store.getters['type-map/isVirtual'](resource);

  return !!validResource;
};

// ************************************************************
//
// BELOW ARE METHODS THAT ARE A PART OF THE AUTHENTICATED MIDDLEWARE REMOVAL. THIS IS A TEMPORARY HOME FOR THESE UTILS AND SHOULD BE REWRITTEN, MOVED OR DELETED.
//
// ************************************************************

/**
 * Attempt to set the product in our datastore if the route matches a known product. Otherwise show an error page instead.
 */
export function setProduct(store, to, redirect) {
  let product = getProductFromRoute(to);

  // since all products are hardcoded as routes (ex: c-local-explorer), if we match the wildcard route it means that the product does not exist
  if ((product && (!to.matched.length || (to.matched.length && to.matched[0].path === '/c/:cluster/:product'))) ||
    // if the product grabbed from the route is not registered, then we don't have it!
    (product && !store.getters['type-map/isProductRegistered'](product))) {
    store.dispatch('loadingError', new Error(store.getters['i18n/t']('nav.failWhale.productNotFound', { productNotFound: product }, true)));

    return () => redirect(302, '/fail-whale');
  }

  if ( !product ) {
    product = LLMOS;
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
export function invalidResource(store, to, redirect) {
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
  const error = new Error(store.getters['i18n/t']('nav.failWhale.resourceNotFound', { resource }, true));

  store.dispatch('loadingError', error);

  return () => redirect(302, '/fail-whale');
}

/**
 * Attempt to load the current user's principal
 */
export async function findMe(store) {
  return store.getters['auth/user'];
}

/**
 * Attempt to login with default credentials. Note: I think that this may actually be outdated since we don't use these default credentials anymore on setup.
 */
export async function tryInitialSetup(store, password = 'admin') {
  try {
    const res = await store.dispatch('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password
      },
    });

    return res._status === 200;
  } catch (e) {
    console.error('Error trying initial setup', e); // eslint-disable-line no-console

    return false;
  }
}

/**
 * Record in our state management that we're indeed logged in
 */
export function isLoggedIn(store, me) {
  store.commit('auth/hasAuth', true);
  store.commit('auth/loggedInAs', me.id);
}

/**
 * Record in our state management that we're not logged in and then redirect to the login page
 */
export function notLoggedIn(store, redirect, route) {
  store.commit('auth/hasAuth', true);

  if ( route.name === 'index' ) {
    return redirect('/auth/login');
  } else {
    return redirect(`/auth/login?${ TIMED_OUT }`);
  }
}

/**
 * Record in our state management that we don't have any auth providers
 */
export function noAuth(store) {
  store.commit('auth/hasAuth', false);
}
