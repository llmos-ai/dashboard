import { Modal, message } from 'ant-design-vue';

import { getAllSchemaAPI, deleteClassAPI, createObjectAPI, getAllObjectAPI } from '@/shell/config/weaviate';

export function proxyClassModel({
  objects = [],
  item = {},
  ctx = {},
}) {
  const id = item.class

  const model = {
    objectCount: (objects.filter((obj) => obj.class === item.class) || []).length,

    availableActions: [
      {
        action:     'insert',
        label:      'Add Document',
        icon:       'icon icon-copy',
        bulkable:   false,
        enabled:    true,
        weight:     10, // Delete always goes last
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

    promptRemove: async () => {
      Modal.confirm({
        title: 'Are you sure you want to delete this Knowledge Base?',
        onOk: async () => {
          const res = await ctx.$store.dispatch(
            `${ ctx.inStore }/request`,
            { 
              url: deleteClassAPI(item.class),
              method: 'DELETE', 
            }
          )

          if (res._status === 200) {
            message.success('Knowledge Base deleted successfully');
            ctx.fetchList();
          }
        },
      });
    },

    insert: async () => {
      const res = await ctx.$store.dispatch(
        `${ ctx.inStore }/request`,
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
  }

  return model || {}
}
