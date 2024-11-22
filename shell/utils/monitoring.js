import { isEmpty } from '@shell/utils/object';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { findBy } from '@shell/utils/array';
import { ENDPOINTS, MONITORING, SCHEMA } from '@shell/config/types';

// Helpers for determining if Monitoring are installed
export function haveMonitoring(getters) {
  const inStore = getters['getStoreNameByProductId'];

  // Just check for the pod monitors CRD
  const schemas = getters[`${ inStore }/all`](SCHEMA);
  const exists = findBy(schemas, 'id', normalizeType(MONITORING.POD_MONITOR));

  return !!exists;
}

export const MONITORING_NAMESPACE = 'llmos-monitoring-system';
export const MONITORING_GRAFANA_PATH = `/api/v1/namespaces/${ MONITORING_NAMESPACE }/services/http:llmos-monitoring-grafana:80/proxy`;

async function hasEndpointSubsets(store, storeType, id) {
  const type = storeType || 'cluster';

  if (store.getters[`${ type }/schemaFor`](ENDPOINTS)) {
    const endpoints = await store.dispatch(`${ type }/findAll`, { type: ENDPOINTS }) || [];

    const endpoint = endpoints.find((ep) => ep.id === id);

    return endpoint && !isEmpty(endpoint) && !isEmpty(endpoint.subsets);
  }

  return false;
}

export async function canViewGrafanaLink(store, storeType) {
  return await hasEndpointSubsets(store, storeType, `${ MONITORING_NAMESPACE }/llmos-monitoring-grafana`);
}

export async function canViewAlertManagerLink(store, storeType) {
  return await hasEndpointSubsets(store, storeType, `${ MONITORING_NAMESPACE }/llmos-monitoring-alertmanager`);
}

export async function canViewPrometheusLink(store, storeType) {
  return await hasEndpointSubsets(store, storeType, `${ MONITORING_NAMESPACE }/llmos-monitoring-prometheus`);
}
