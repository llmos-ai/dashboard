<script>
import ResourceTable from '@shell/components/ResourceTable';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { NAME, STATE, NAMESPACE, AGE } from '@shell/config/table-headers';
import { SelectOutlined } from '@ant-design/icons-vue';

export default {
  name: 'ApplicationDataList',

  components: { 
    ResourceTable,
    SelectOutlined,
  },

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
    await allHash({ resource: await this.$fetchType(this.resource) });
  },

  computed: {
    headers() {
      const DOCUMENT_COUNT = {
        name:  'documentCount',
        label: this.t('applicationData.documentCount.label')
      };

      const IMPORT_DATA = {
        name:  'importData',
        icon:    'icon icon-fw icon-copy',
        label:   this.t('knowledgeBase.actions.importData'),
      };

      const HIT_TEST = {
        name:  'hitTest',
        icon:    'icon icon-fw icon-checkmark',
        label:   this.t('knowledgeBase.actions.hitTest'),
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        DOCUMENT_COUNT,
        IMPORT_DATA,
        HIT_TEST,
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
  >
    <template #col:importData="{row}">
      <td>
        <a-button 
          type="link"
          @click.prevent="row.importData()"
        >
          <SelectOutlined />
        </a-button>
      </td>
    </template>
    <template #col:hitTest="{row}">
      <td>
        <a-button 
          type="link"
          @click.prevent="row.hitTest()"
        >
          <SelectOutlined  />
        </a-button>
      </td>
    </template>
  </ResourceTable>
</template>
