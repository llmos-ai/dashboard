<script>
import { Modal, message } from 'ant-design-vue';

import { getAllSchemaAPI, deleteClassAPI, createObjectAPI, getAllObjectAPI } from '@/shell/config/weaviate';
import ResourceTable from '@shell/components/ResourceTable';
import ButtonLink from '@shell/components/ButtonLink';

import { NAME, AGE } from '@shell/config/table-headers';
import { allHash } from '@shell/utils/promise';

import { proxyClassModel } from './proxyClassModel';

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
          label:         '文档数',
          value:         'objectCount',
        },
        {
          name:          'characterCount',
          label:         '字符数',
          value:         'characterCount',
        },
        {
          name:          'application',
          label:         '关联应用数',
          value:         'application',
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
          ...proxyClassModel({
            objects: this.objects,
            item,
            ctx: this,
          }),
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
