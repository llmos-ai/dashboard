<script>
import Select from '@shell/components/form/Select';
import { Card } from '@components/Card';
import ActionDropdown from '@shell/components/ActionDropdown';

export default {
  components: {
    Card, Select, ActionDropdown
  },
  data() {
    const modelOptions = [{
      value: 'gpt-3.5-turbo-1106',
      label: 'gpt-3.5-turbo-1106'
    }, {
      value: 'gpt-4-turbo',
      label: 'gpt-4-turbo'
    }, {
      value: 'deepseek',
      label: 'deepseek'
    }];

    return {
      modelOptions,
      model: 'gpt-3.5-turbo-1106'
    };
  },

  methods: {
    handleModel(modelSign) {
      console.log('🚀 ~ handleModel ~ modelSign:');
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="span-6">
        <Card
          :show-highlight-border="false"
          :hasDivider="false"
          :showActions="false"
          class="marked-view"
        >
          <template #title>
            <div class="flex flex-grow justify-between align-middle">
              <span>#1</span>
              <span
                class="cursor-pointer"
                @click="handleModel"
              >
                {{ model }}
                <i class="icon icon-chevron-down" />
                <!-- <Select
                  v-model="model"
                  class="w-200px"
                  :options="modelOptions"
                /> -->
              </span>
              <ActionDropdown>
                <template #button-content>
                  <!-- <button
                    type="button"
                    class="btn btn-sm role-link"
                  > -->
                  <!-- <i class="icon icon-gear" /> -->
                  <span>{{ t('sortableTable.bulkActions.collapsed.label') }}</span>
                  <i class="icon icon-chevron-down" />
                  <!-- </button> -->
                </template>
              </ActionDropdown>
              <!-- <i class="icon icon-actions cursor-pointer" /> -->
            </div>
          </template>
        </Card>
      </div>

      <div class="span-6">
        <Card
          :show-highlight-border="false"
          :hasDivider="false"
          :showActions="false"
          class="marked-view"
        >
          <template #title>
            <div>#1</div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
