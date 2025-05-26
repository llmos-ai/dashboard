<script>
import ResourceTable from '@shell/components/ResourceTable';
import LiveData from '@shell/components/formatter/LiveDate';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

import ResourceFetch from '@shell/mixins/resource-fetch';
import { allHash } from '@shell/utils/promise';
import { LLMOS } from '@shell/config/types';
import { NAME, STATE, NAMESPACE, AGE, STORAGE_CLASS_DEFAULT } from '@shell/config/table-headers';

export default {
  name: 'LocalModelVersionList',

  components: { 
    ResourceTable,
    LiveData, 
    ActionMenu,
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
    const inStore = this.$store.getters['currentProduct'].inStore;

    await allHash({
      resource:        await this.$fetchType(this.resource),
      localModels: await this.$store.dispatch(`${ inStore }/findAll`, { type: LLMOS.LOCAL_MODEL }),
    });
  },

  computed: {
    headers() {
      const LOCAL_MODEL = {
        name:  'sourceModelDisplay',
        label: this.t('localModel.localModel.label')
      };

      const VOLUME_SNAPSHOT = {
        name: 'status.volumeSnapshot',
        label: this.t('localModel.volumeSnapshot.label')
      };

      const headers = [
        STATE,
        NAME,
        NAMESPACE,
        LOCAL_MODEL,
        VOLUME_SNAPSHOT,
        STORAGE_CLASS_DEFAULT,
        AGE,
      ];

      return headers;
    },
  },

  methods: {
    templateLabel(group) {
      return group.key;
    },

    valueFor(group) {
      const resource = group?.rows?.[0];

      return resource?.creationTimestamp;
    },

    templateResource(group) {
      return group?.rows?.[0];
    },

    showActions(e, group) {
      console.log('showActions', group);
      const row = group.rows[0];

      this.$store.commit(`action-menu/show`, {
        resources: [row],
        elem:      e.target
      });
    },
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
  >
    <template #group-by="group">
      <div class="group-bar">
        <div class="group-tab">
          <div v-clean-html="templateLabel(group.group)" class="project-name" />
        </div>

        <div class="right">
          <ActionMenu
            v-if="false"
            :resource="group.group.rows[0]"
          />
        </div>
      </div>
    </template>
  </ResourceTable>  
</template>

<style lang="scss" scoped>
::v-deep {
  .group-name {
    line-height: 30px;
  }

  .group-bar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .right {
      display: flex;
      align-items: center;
      .age {
        width: 100px;
      }

      .actions {
        padding-right: 7px;
      }

      padding-right: 9px;
    }
  }
}
</style>
