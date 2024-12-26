import { MONITORING } from '@shell/config/types';

/**
 * Find secondary schema's related to the primary `monitoring.coreos.com.alertmanagerconfig` schema
 */
export const fetchAlertManagerConfigSpecs = async($store) => {
  const schema = $store.getters['cluster/schemaFor'](MONITORING.ALERTMANAGER_CONFIG);

  if (!schema) {
    return;
  }

  // Make the http request to fetch schema definitions for alertmanagerconfig
  await schema.fetchResourceFields();

  return {
    receiverSchema: schema.schemaDefinitions?.[`${ schema.schemaDefinition.type }.spec.receivers`],
    routeSchema:    schema.schemaDefinitions?.[`${ schema.schemaDefinition.type }.spec.route`],
  };
};
