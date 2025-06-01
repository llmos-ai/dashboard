<script>
import { Modal, message } from 'ant-design-vue';

import { getAllSchemaAPI, deleteObjectAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';
import ButtonLink from '@shell/components/ButtonLink';

import { NAME, AGE } from '@shell/config/table-headers';

export default {
  layout: 'plain',

  components: {
    ResourceTable,
    ButtonLink,
  },

  data() {
    return {
      classes: [],
      schema:  {},
      headers: [

      ],
    };
  },

  async fetch() {
    this.fetchList()
  },

  computed: {
    createLocation() {
      return {
        name:   `c-cluster-apps-knowledgeBase-create`,
        params: { cluster: 'local' }
      };
    },

    headers() {
      return [
        {
          ...NAME,
          value: 'class',
        },
      ];
    },

    inStore() {
      return this.$store.getters['currentProduct'].inStore;
    },

    rows() {
      return this.classes.map((item) => {
        return {
          ...item,
          availableActions: [
            {
              action:     'promptRemove',
              altAction:  'remove',
              label:      this.t('action.remove'),
              icon:       'icon icon-trash',
              bulkable:   true,
              enabled:    true,
              bulkAction: 'promptRemove',
              weight:     -10, // Delete always goes last
            },
          ],
          promptRemove: async () => {
            Modal.confirm({
              title: 'Are you sure you want to delete this Knowledge Base?',
              onOk: async () => {
                const res = await this.$store.dispatch(
                  `${ this.inStore }/request`,
                  { 
                    url: deleteObjectAPI(item.class),
                    method: 'DELETE', 
                  }
                )

                if (res._status === 200) {
                  message.success('Knowledge Base deleted successfully');
                  this.fetchList();
                }
              },
            });
          },
        };
      })
    }
  },

  methods: {
    async fetchList(item) {
      const res = await this.$store.dispatch(
        `${ this.inStore }/request`,
        { url: getAllSchemaAPI }
      );

      this.classes = res.classes || [];
    }
  },
};
</script>

<template>
  <div>
    <header>
      <div class="title">
        <h1 class="m-0">
          Knowledge Base
        </h1>
      </div>
      <div class="actions-container">
        <div class="actions">
          <button-link
            :to="createLocation"
          >
            Create
          </button-link>
        </div>
      </div>
    </header>
    <ResourceTable
      :schema="schema"
      :headers="headers"
      :rows="rows"
    />
  </div>
</template>
