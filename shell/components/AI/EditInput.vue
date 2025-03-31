<script setup>
import { ref, watch } from 'vue';
import { EditOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  value: {
    type:    String,
    default: '',
  },
  isEdit: {
    type:    Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:value']);

const inputValue = ref(props.value);
const editing = ref(props.isEdit);

watch(
  () => props.value,
  (newVal) => {
    inputValue.value = newVal;
  }
);

const toggleEdit = () => {
  editing.value = true;
};

const handleCancel = () => {
  inputValue.value = props.value;
  editing.value = false;
};

const save = () => {
  emit('update:value', inputValue.value);
  editing.value = false;
};
</script>

<template>
  <div>
    <div
      v-if="!editing"
      class="relative"
    >
      <div class="flex flex-col items-end group w-auto">
        <span class="px-[16px] py-[9px] rounded-xl bg-[#a22d2d0a] w-auto">
          {{ inputValue }}
        </span>

        <div
          class="action w-auto group-hover:opacity-100 opacity-0 transition-opacity duration-300"
        >
          <a-button
            type="button"
            class="btn btn-sm role-link"
            @click="toggleEdit"
          >
            <EditOutlined />
          </a-button>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="flex items-end">
        <button
          type="button"
          class="btn btn-sm role-link"
          @click="handleCancel"
        >
          <i class="icon icon-close" />
        </button>

        <a-textarea
          v-model:value="inputValue"
          auto-size
        />

        <a-button
          shape="circle"
          type="primary"
          class="btn-sm inline-flex items-center ml-5"
          @click="save"
        >
          <template #icon>
            <ArrowUpOutlined class="!align-text-bottom" />
          </template>
        </a-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.v-center {
  vertical-align: 0px !important;
}
</style>
