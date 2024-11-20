export function mergeObjectAndArray(obj: {}, array: []): {} {
  const result = { ...obj }; // Create a shallow copy of the object

  array.forEach(({ key, value }) => {
    result[key] = value; // Overwrite or add the key-value pair
  });

  return result;
}

export function mergeObjectValueFromArrayEnv(obj: {}, array: []): {} {
  array.forEach(({ name, value }) => {
    if (name in obj) {
      obj[name] = value; // Update the existing key with the new value
    }
  });

  return obj;
}

export function mergeEnvs(env: [], inputs: any[]) : {} {
  const mergedEnvs = [...env, ...inputs].reduce((acc, current) => {
    // Check if the current object has a valid value or typed keyRef value
    const hasValidName = current.name !== undefined && current.name !== '';
    const hasValidValue = current.value !== undefined && current.value !== '';
    const hasValidSecretKeyRef = current.valueFrom && current.valueFrom.secretKeyRef && current.valueFrom.secretKeyRef.name !== '' && current.valueFrom.secretKeyRef.key !== '';
    const hasValidConfigMapKeyRef = current.valueFrom && current.valueFrom.configMapKeyRef && current.valueFrom.configMapKeyRef.name !== '' && current.valueFrom.configMapKeyRef.key !== '';
    const hasValidResourceField = current.valueFrom && current.valueFrom.resourceFieldRef && current.valueFrom.resourceFieldRef.resource !== '';
    const hasValidFieldRef = current.valueFrom && current.valueFrom.fieldRef && current.valueFrom.fieldRef.fieldPath !== '';

    // If the object has valid data, proceed
    if (hasValidName && (hasValidValue || hasValidSecretKeyRef || hasValidConfigMapKeyRef || hasValidResourceField || hasValidFieldRef)) {
      // Check if the name already exists in the accumulator
      const existingIndex = acc.findIndex((item) => item.name === current.name);

      if (existingIndex > -1) {
        // Merge or replace the existing object
        acc[existingIndex] = { ...acc[existingIndex], ...current };
      } else {
        // Add the new object if the name does not exist
        acc.push(current);
      }
    }

    return acc;
  }, []);

  return mergedEnvs;
}
