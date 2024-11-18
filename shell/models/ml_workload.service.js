import { MANAGEMENT, ML_WORKLOAD_TYPES, SERVICE } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { SETTING } from '@shell/config/settings';

export const TYPE_TO_SVC_PORT_NAME_MAPPING = {
  [ML_WORKLOAD_TYPES.RAY_CLUSTER]:   'dashboard',
  [ML_WORKLOAD_TYPES.NOTEBOOK]:      'http',
  [ML_WORKLOAD_TYPES.MODEL_SERVICE]: 'http',
};

export default class MLWorkloadService extends SteveModel {
  get serverUrl() {
    const serverUrl = this.$getters['byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    if (serverUrl?.value) {
      return serverUrl.value;
    }

    return serverUrl?.default || '';
  }

  get endpointUrl() {
    const uid = this.metadata.uid;
    const services = this.$rootGetters['cluster/all'](SERVICE) || [];
    const svc = services.find((s) => s.metadata.ownerReferences?.some((o) => o.uid === uid)
    );

    if (!svc) {
      return '';
    }

    const serverURL = this.serverUrl || window.location.origin;
    const url = new URL(serverURL);
    const portName = TYPE_TO_SVC_PORT_NAME_MAPPING[this.type];
    const port = svc.spec.ports.find((p) => p.name === portName);

    switch (svc.spec.type) {
    case 'NodePort':
      return `http://${ url.hostname }:${ port.nodePort }`;
    case 'LoadBalancer':
      return `http://${ url.hostname }:${ port.port }`;
    default:
      return `${ window.location.origin }/api/v1/namespaces/${ svc.metadata.namespace }/services/${ svc.metadata.name }:${ port.name }/proxy`;
    }
  }

  get openaiApiUrl() {
    const url = this.endpointUrl;

    return url ? `${ url }/v1` : 'URL not found';
  }

  get internalApiUrl() {
    const services = this.$rootGetters['cluster/all'](SERVICE) || [];
    const svc = services.find((s) => s.metadata.ownerReferences?.some((o) => o.uid === this.metadata.uid)
    );

    if (!svc) {
      return 'URL not found';
    }

    return `http://${ svc.metadata.name }.${ svc.metadata.namespace }.svc.cluster.local:${ svc.spec.ports[0].port }/v1`;
  }

  cleanForSave(data) {
    const val = super.cleanForSave(data);

    delete val.__active;
    delete val.type;

    return val;
  }

  cleanContainerForSave(container) {
    delete container.__active;
    delete container.active;
    delete container._init;
    delete container.error;

    return container;
  }
}
