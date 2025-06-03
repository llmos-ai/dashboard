import { Modal, message } from 'ant-design-vue';

import { deleteClassAPI, createObjectAPI } from '@/shell/config/weaviate';
import { uniq } from '@shell/utils/array';

export function proxyClassModel({
  objects = [],
  item = {},
  ctx = {},
}) {
  const id = item.class;

  const model = {
    objectCount: uniq(objects.filter((obj) => obj.class === item.class).map((obj) => obj.properties?.document) || []).length,

    availableActions: [
      {
        action:   'insert',
        label:    'Add Document',
        icon:     'icon icon-copy',
        bulkable: false,
        enabled:  true,
        weight:   10, // Delete always goes last
      },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      ctx.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   false,
        enabled:    true,
        bulkAction: 'promptRemove',
        weight:     -10, // Delete always goes last
      },
    ],

    promptRemove: async() => {
      Modal.confirm({
        title: 'Are you sure you want to delete this Knowledge Base?',
        onOk:  async() => {
          const res = await ctx.$store.dispatch(
            `${ ctx.inStore }/request`,
            {
              url:    deleteClassAPI(item.class),
              method: 'DELETE',
            }
          );

          if (res._status === 200) {
            message.success('Knowledge Base deleted successfully');
            ctx.fetchList();
          }
        },
      });
    },

    insert: async() => {
      const res = await ctx.$store.dispatch(
        `${ ctx.inStore }/request`,
        {
          url:    createObjectAPI,
          method: 'POST',
          data:   {
            class:      item.class,
            properties: {
              text:     `办理和其他前期工作进展。`,
              keywords: '背景 必要性 建设背景',
              document: '文档2',
              index:    1,
            },
            vector: [0.1, 0.2, 0.3],
          }
        }
      );

      if (res._status === 200) {
        message.success('Insert successfully');
        ctx.fetchList();
      }
    },

    detailLocation: {
      name:   `c-cluster-apps-knowledgeBase-id`,
      params: {
        cluster: 'local',
        id,
      }
    },

    id,
  };

  return model || {};
}
