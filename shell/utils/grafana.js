import { parse as parseUrl, addParam } from '@shell/utils/url';

export function getClusterPrefix(monitoringVersion, clusterId) {
  return clusterId === 'local' ? '' : `/k8s/clusters/${ clusterId }`;
}

export function computeDashboardUrl(monitoringVersion, embedUrl, clusterId, params, modifyPrefix = true) {
  const url = parseUrl(embedUrl);

  let newUrl = modifyPrefix ? `${ getClusterPrefix(monitoringVersion, clusterId) }${ url.path }` : url.path;

  if (url.query.viewPanel) {
    newUrl = addParam(newUrl, 'viewPanel', url.query.viewPanel);
  }
  newUrl = addParam(newUrl, 'orgId', url.query.orgId);
  newUrl = addParam(newUrl, 'kiosk', null);

  Object.entries(params).forEach((entry) => {
    newUrl = addParam(newUrl, entry[0], entry[1]);
  });

  return newUrl;
}

export async function dashboardExists(monitoringVersion, store, clusterId, embedUrl, storeName = 'cluster', projectId = null) {
  const url = parseUrl(embedUrl);
  const prefix = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/`;
  const delimiter = 'http:llmos-monitoring-grafana:80/proxy/';

  // NOTE: project-level dashboards are not supported yet
  // if (projectId) {
  //   prefix = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/llmos-project-${ projectId }-monitoring/services/http:llmos-project-${ projectId }-monitoring-grafana:80/proxy/`;
  //   delimiter = `http:cattle-project-${ projectId }-monitoring-grafana:80/proxy/`;
  // }
  const path = url.path.split(delimiter)[1];
  const uid = path.split('/')[1];

  const newUrl = `${ prefix }api/dashboards/uid/${ uid }`;

  try {
    await store.dispatch(`${ storeName }/request`, { url: newUrl, redirectUnauthorized: false });

    return true;
  } catch (ex) {
    return false;
  }
}

export async function allDashboardsExist(store, clusterId, embeddedUrls, storeName = 'cluster', projectId = null) {
  const monitoringVersion = '';
  const existPromises = embeddedUrls.map((url) => dashboardExists(monitoringVersion, store, clusterId, url, storeName, projectId));

  return (await Promise.all(existPromises)).every((exists) => exists);
}

export function queryGrafana(monitoringVersion, dispatch, clusterId, query, range, step) {
  const url = `${ getClusterPrefix(monitoringVersion, clusterId) }/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy/api/datasources/proxy/1/api/v1/query_range?query=${ query }&start=${ range.start }&end=${ range.end }&step=${ step }`;

  const req = dispatch('cluster/request', { url, redirectUnauthorized: false });

  return req;
}

export async function hasLeader(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (5 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'max(etcd_server_has_leader)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] === '1';
}

export async function leaderChanges(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'max(etcd_server_leader_changes_seen_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}

export async function failedProposals(monitoringVersion, dispatch, clusterId) {
  const end = Date.now() / 1000;
  const start = end - (60 * 60);

  const response = await queryGrafana(monitoringVersion, dispatch, clusterId, 'sum(etcd_server_proposals_failed_total)', { start, end }, 30);

  return response.data.result[0]?.values?.[0]?.[1] || 0;
}
