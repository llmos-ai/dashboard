const baseUrl = '/proxy/vectorDB'
export const getAllSchemaAPI = `${ baseUrl }/v1/schema`;
export const deleteClassAPI = (className) => `${ baseUrl }/v1/schema/${className}`;

export const createObjectAPI = `${ baseUrl }/v1/objects`;
export const getAllObjectAPI = `${ baseUrl }/v1/objects`;

// export const insertDataAPI = (className) => `${ baseUrl }/v1/objects`;
