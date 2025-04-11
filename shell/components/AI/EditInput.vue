<script setup>
import { ref, watch } from 'vue';
import { EditOutlined, ArrowUpOutlined } from '@ant-design/icons-vue';
import ChatAction from '@shell/components/ChatAction.vue';

const props = defineProps({
  value: {
    type:    String,
    default: '',
  },
  isEdit: {
    type:    Boolean,
    default: false,
  },
  canEdit: {
    type:    Boolean,
    default: false,
  },
});

const emits = defineEmits(['update:value']);

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
  emits('update:value', inputValue.value);
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
        <span class="px-[16px] py-[9px] rounded-xl bg-[#a22d2d0a] w-auto mb-5">
          {{ inputValue }}
        </span>

        <div
          class="action w-auto group-hover:opacity-100 opacity-0 transition-opacity duration-300"
        >
          <ChatAction
            :showRegenerate="false"
            :copyContent="inputValue"
          >
            <template #prefix>
              <a-tooltip
                v-if="canEdit"
                title="修改"
              >
                <a-button
                  type="text"
                  size="small"
                  @click="toggleEdit"
                >
                  <EditOutlined />
                </a-button>
              </a-tooltip>
            </template>
          </ChatAction>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="flex items-end">
        <a-button
          type="link"
          @click="handleCancel"
        >
          <i class="icon icon-close" />
        </a-button>

        <a-textarea
          v-model:value="inputValue"
          auto-size
          @keyup.alt.enter.exact="save"
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
