import { allHash } from '@shell/utils/promise';

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
