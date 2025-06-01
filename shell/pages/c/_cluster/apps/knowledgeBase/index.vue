<script>
import { Modal, message } from 'ant-design-vue';

import { getAllSchemaAPI, deleteClassAPI, createObjectAPI, getAllObjectAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';
import ButtonLink from '@shell/components/ButtonLink';

import { NAME, AGE } from '@shell/config/table-headers';
import { allHash } from '@shell/utils/promise';

export default {
  layout: 'plain',

  components: {
    ResourceTable,
    ButtonLink,
  },

  data() {
    return {
      classes: [],
      objects: [],
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
        {
          name:          'objectCount',
          labelKey:      'knowledgeBase.objectCount.label',
          sort:          ['nameSort'],
          value:         'objectCount',
        }
      ];
    },

    inStore() {
      // const query = `{
      //   Get {
      //     Qingyang {
      //       _additional {
      //         id
      //       }
      //       test
      //     }
      //   }
      // }`
      return this.$store.getters['currentProduct'].inStore;
    },

    rows() {
      return this.classes.map((item) => {
        return {
          ...item,
          objectCount: (this.objects.filter((obj) => obj.class === item.class) || []).length,
          availableActions: [
            {
              action:     'insert',
              label:      'Insert',
              icon:       'icon icon-copy',
              bulkable:   false,
              enabled:    true,
              weight:     10, // Delete always goes last
            },
            {
              action:     'promptRemove',
              altAction:  'remove',
              label:      this.t('action.remove'),
              icon:       'icon icon-trash',
              bulkable:   false,
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
                    url: deleteClassAPI(item.class),
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
          insert: async () => {
            const res = await this.$store.dispatch(
              `${ this.inStore }/request`,
              { 
                url: createObjectAPI,
                method: 'POST', 
                data: {
                  class: item.class,
                  properties: {
                    text: '显示器周围如果存在强电场或强磁场的话，也会导致电脑屏幕抖动或者闪烁。主要看看你的显示器周围有没有放一些其它家电之类的，比如电视机，冰箱，电磁炉……，如果有的话请讲这些电器远离显示器即可。',
                    name: '显示器',
                  },
                  vector: [0.1, 0.2, 0.3],
                }
              }
            )

            if (res._status === 200) {
              message.success('Insert successfully');
              this.fetchList();
            }
          }
        };
      })
    }
  },

  methods: {
    async fetchList(item) {
      const hash = await allHash({
        classes: this.$store.dispatch(
          `${ this.inStore }/request`,
          { url: getAllSchemaAPI }
        ),
        objects: this.$store.dispatch(
          `${ this.inStore }/request`,
          { url: getAllObjectAPI }
        ),
      }) 

      this.classes = hash.classes.classes || [];
      this.objects = hash.objects.objects || [];
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
