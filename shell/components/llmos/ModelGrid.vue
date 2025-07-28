<script>
import ModelCard from './ModelCard.vue';

export default {
  name: 'ModelGrid',

  components: { ModelCard },

  props: {
    items: {
      type:     Array,
      required: true,
    },

    currentPage: {
      type:    Number,
      default: 1
    },

    pageSize: {
      type:    Number,
      default: 9
    },

    total: {
      type:     Number,
      required: true
    },

    testIdPrefix: {
      type:    String,
      default: 'model'
    },

    defaultIcon: {
      type:    String,
      default: '/img/generic-catalog.svg'
    },

    descriptionField: {
      type:    String,
      default: 'spec.modelCard.description'
    },

    fallbackDescriptionField: {
      type:    String,
      default: null
    },

    showActions: {
      type:    Boolean,
      default: false
    },
  },

  emits: ['update:currentPage'],

  computed: {
    splitDataSource() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return this.items.slice(start, end);
    }
  },

  methods: {
    onPageChange(page) {
      this.$emit('update:currentPage', page);
    }
  }
};
</script>

<template>
  <div>
    <div class="grid">
      <template v-if="splitDataSource.length === 0">
        <a-empty />
      </template>
      <template v-else>
        <ModelCard
          v-for="(row, i) in splitDataSource"
          :key="i"
          :row="row"
          :test-id-prefix="testIdPrefix"
          :default-icon="defaultIcon"
          :description-field="descriptionField"
          :fallback-description-field="fallbackDescriptionField"
          :show-actions="showActions"
        >
          <template #actions="{ row: actionRow }">
            <slot
              name="actions"
              :row="actionRow"
            />
          </template>
        </ModelCard>
      </template>
    </div>

    <a-pagination
      :current="currentPage"
      :defaultPageSize="pageSize"
      :total="total"
      show-less-items
      hideOnSinglePage
      @change="onPageChange"
    />
  </div>
</template>

<style lang="scss" scoped>
$margin: 10px;

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1 * $margin;

  :deep(.ant-empty) {
    margin: auto;
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    :deep(.item) {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    :deep(.item) {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    :deep(.item) {
      width: calc(50% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    :deep(.item) {
      width: calc(33.33333% - 2 * #{$margin});
    }
  }
}

.ant-pagination {
  text-align: end;
}
</style>
