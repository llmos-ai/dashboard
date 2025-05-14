<script setup>
import {
  ref, reactive, nextTick, defineEmits, defineProps
} from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { title } from 'process';

const MAX_TAG_LENGTH = 20;

const props = defineProps({
  value: {
    type:    Array,
    default: () => {
      return [];
    },
  },

  mode: {
    type:    String,
    default: 'edit',
  },

  addLabelKey: {
    type:    String,
    default: 'LabeledTag.addLabel',
  },

  titleKey: {
    type:    String,
    default: 'LabeledTag.title',
  },
});

const emit = defineEmits(['update:value']);

const inputRef = ref();

const state = reactive({
  tags:         [],
  inputVisible: false,
  inputValue:   '',
});

const onClose = (removedTag) => {
  const tags = state.tags.filter((tag) => tag !== removedTag);

  state.tags = tags;
};

const showInput = () => {
  state.inputVisible = true;

  nextTick(() => {
    inputRef.value.focus();
  });
};

const onInputConfirm = () => {
  const inputValue = state.inputValue;

  let tags = state.tags;

  if (inputValue && tags.indexOf(inputValue) === -1) {
    tags = [...tags, inputValue];
  }

  Object.assign(state, {
    tags,
    inputVisible: false,
    inputValue:   '',
  });

  emit('update:value', tags);
};
</script>

<script>
export default {
  setup() {

  }
};
</script>

<template>
  <div class="label">
    <div class="text-label">
      <t :k="titleKey" />
    </div>
  </div>
  <div class="mt-10">
    <template
      v-for="(tag, index) in state.tags"
      :key="tag"
    >
      <a-tag
        v-clean-tooltip="tag"
        color="blue"
        closable
        @close="onClose(tag)"
      >
        {{ (tag || '').length > MAX_TAG_LENGTH ? `${tag.slice(0, MAX_TAG_LENGTH)}...` : tag }}
      </a-tag>
    </template>
    <a-input
      v-if="state.inputVisible"
      ref="inputRef"
      v-model:value="state.inputValue"
      type="text"
      size="small"
      class="input"
      @blur="onInputConfirm"
      @keyup.enter="onInputConfirm"
    />
    <a-tag
      v-else
      class="new-tag hand"
      @click="showInput"
    >
      <PlusOutlined />
      {{ t(addLabelKey) }}
    </a-tag>
  </div>
</template>

<style lang="scss" scoped>
.input {
  width: 78px;
}

.new-tag {
  background: #fff;
  border-style: dashed
}
</style>
