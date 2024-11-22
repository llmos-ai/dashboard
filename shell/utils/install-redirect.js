import { MANAGEMENT } from '@shell/config/types';
import { ADDON_NAME, ADDON_NAMESPACE } from '@shell/config/product/monitoring';

export default function(product, chartName, defaultResourceOrRoute, install = true) {
  return async function middleware({ redirect, store } ) {
    const cluster = store.getters['currentCluster']?.id || 'local';

    if ( store.getters['type-map/isProductActive'](product) ) {
      // If the product is installed and there's a default resource, redirect there
      if ( defaultResourceOrRoute ) {
        if ( typeof defaultResourceOrRoute === 'object' ) {
          return redirect(defaultResourceOrRoute);
        }

        return redirect({
          name:   'c-cluster-product-resource',
          params: {
            cluster,
            product,
            resource: defaultResourceOrRoute
          },
        });
      }
      // Otherwise just let the middleware pass through
    } else if (install) {
      // The product is not installed, redirect to the details chart
      return redirect({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster,
          product:   'llmos',
          resource:  MANAGEMENT.MANAGED_ADDON,
          namespace: ADDON_NAMESPACE,
          id:        ADDON_NAME,
        },
      });
    } else {
      return redirect({
        name:   'c-cluster-llmos',
        params: { cluster },
      });
    }
  };
}
