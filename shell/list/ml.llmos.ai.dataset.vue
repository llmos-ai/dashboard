<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';
import { NAME, STATE, NAMESPACE, AGE } from '@shell/config/table-headers';

export default {
  name: 'ModelRegistryList',

  components: { ResourceTable },

  mixins: [ResourceFetch],

  props: {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({
      resource:        await this.$fetchType(this.resource),
      datasetVersions: await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.DATASET_VERSION }),
    });
  },

  computed: {
    datasetVersions() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/all`](LLMOS.DATASET_VERSION) || [];
    },

    headers() {
      const REGISTRY = {
        name:  'spec.registry',
        label: this.t('datasetCard.registry.label')
      };

      const PUBLISHED_VERSION = {
        name:  'publishedVersion',
        label: this.t('datasetList.publishedVersion'),
        value: (row) => {
          const versions = this.datasetVersions.filter((v) => {
            const rootPath = v?.status?.rootPath || '';
            const expectedPath = `datasets/${ row.id }`;

            return (rootPath === expectedPath || rootPath.startsWith(`${ expectedPath }/`)) &&
                   v.status?.publishStatus?.phase === 'SnapshotReady';
          });

          if (versions.length === 0) {
            return '-';
          }

          // Sort by version number and format as tags
          return versions
            .map((v) => {
              const versionNumber = v.spec?.version || '';

              return `${ versionNumber }`;
            })
            .sort();
        },
        formatter: 'VersionTags'
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        REGISTRY,
        PUBLISHED_VERSION,
        AGE,
      ];

      return headers;
    }
  },
};
</script>

<template>
  <ResourceTable
    :loading="loading"
    :schema="schema"
    :rows="rows"
    :headers="headers"
    :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
    :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    groupable
  />
</template>
