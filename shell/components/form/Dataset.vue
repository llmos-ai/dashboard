<script setup>
import { computed, getCurrentInstance } from 'vue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { LLMOS } from '@shell/config/types';

// Props
const props = defineProps({
  value: {
    type:    Object,
    default: () => ({})
  },
  mode: {
    type:    String,
    default: 'create'
  }
});

// Emits
const emit = defineEmits(['update:value']);

// Get current instance to access $store
const { proxy } = getCurrentInstance();

// Computed properties
const datasetMountings = computed({
  get() {
    return props.value?.datasetMountings || [];
  },
  set(value) {
    const updatedValue = {
      ...props.value,
      datasetMountings: value,
    };

    emit('update:value', updatedValue);
  }
});

const datasets = computed(() => {
  const inStore = proxy.$store.getters['currentStore'](LLMOS.DATASET);

  return proxy.$store.getters[`${ inStore }/all`](LLMOS.DATASET) || [];
});

const datasetVersions = computed(() => {
  const inStore = proxy.$store.getters['currentStore'](LLMOS.DATASET_VERSION);

  return proxy.$store.getters[`${ inStore }/all`](LLMOS.DATASET_VERSION) || [];
});

const datasetOptions = computed(() => {
  return datasets.value.map((dataset) => ({
    label: dataset.metadata.name,
    value: dataset.metadata.name
  }));
});

// Methods
const onDatasetChange = (index, datasetName) => {
  const updated = [...datasetMountings.value];

  updated[index] = {
    ...updated[index],
    datasetName,
    version: '' // Reset version when dataset changes
  };
  datasetMountings.value = updated;
};

const getVersionOptions = (datasetName) => {
  if (!datasetName) {
    return [];
  }

  const dataset = datasets.value.find((d) => d.metadata.name === datasetName);

  if (!dataset) {
    return [];
  }

  // Get versions for this dataset
  const versions = datasetVersions.value.filter((version) => {
    return (version?.status?.rootPath || '').includes(`datasets/${ dataset.id }`);
  });

  return versions.filter(v => v.spec.publish).map((version) => ({
    label: ((version.metadata.name || '').split('-') || [])?.[0] || {},
    value: version.spec.version
  })).sort((a, b) => {
    // Sort versions in descending order (newest first)
    const matchA = (a.value || '').match(/^v(\d+)/);
    const matchB = (b.value || '').match(/^v(\d+)/);

    const versionA = matchA ? parseInt(matchA[1]) : 0;
    const versionB = matchB ? parseInt(matchB[1]) : 0;

    return versionB - versionA;
  });
};

// Fetch data on component mount
const fetchData = async() => {
  const inStore = proxy.$store.getters['currentStore'](LLMOS.DATASET);

  await Promise.all([
    proxy.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET }),
    proxy.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET_VERSION })
  ]);
};

// Call fetch on component mount
fetchData();
</script>

<template>
  <ArrayListGrouped
    v-model:value="datasetMountings"
    :mode="mode"
    :default-add-value="{
      datasetName: '',
      version: '',
      mountPath: '/home/jovyan/datasets'
    }"
    :add-label="t('datasetCard.addDataset')"
  >
    <template #default="{ row, i }">
      <div class="row mt-20">
        <div class="col span-4">
          <LabeledSelect
            v-model:value="row.value.datasetName"
            :label="t('datasetCard.datasetName.label')"
            :placeholder="t('datasetCard.datasetName.placeholder')"
            :options="datasetOptions"
            :mode="mode"
            :required="true"
            @update:value="onDatasetChange(i, $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            v-model:value="row.value.version"
            :label="t('datasetCard.version.label')"
            :placeholder="t('datasetCard.version.placeholder')"
            :options="getVersionOptions(row.value.datasetName)"
            :mode="mode"
            :required="true"
            :disabled="!row.value.datasetName"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="row.value.mountPath"
            :label="t('datasetCard.mountPath.label')"
            :placeholder="t('datasetCard.mountPath.placeholder')"
            :mode="mode"
            :required="true"
          />
        </div>
      </div>
    </template>
  </ArrayListGrouped>
</template>

<style lang="scss" scoped>
// ArrayListGrouped handles the styling, no custom styles needed
</style>
