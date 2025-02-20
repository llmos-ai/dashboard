<script>
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';

export default {
  name:       'EditInput',
  components: { TextAreaAutoGrow },
  props:      {
    value: {
      type:    String,
      default: '',
    },
    isEdit: {
      type:    Boolean,
      default: false,
    },
  },
  data() {
    return {
      beforeValue: '',
      editing:     this.isEdit,
      inputValue:  this.value,
    };
  },
  watch: {
    value(newVal) {
      this.inputValue = newVal;
    },
  },
  methods: {
    toggleEdit() {
      this.editing = true;
    },

    handleCancel() {
      this.inputValue = this.value;
      this.editing = false;
    },

    save() {
      this.$emit('input', this.inputValue);
      this.editing = false;
    }
  },
};
</script>

<template>
  <div class="edit-input">
    <div
      v-if="!editing"
      class="editText"
    >
      <span>
        {{ inputValue }}
        <button
          type="button"
          class="btn btn-sm role-link"
        >
          <i
            class="icon icon-edit"
            @click="toggleEdit"
          />
        </button>
      </span>
    </div>

    <div v-else>
      <div class="input-area">
        <TextAreaAutoGrow
          v-model="inputValue"
          @blur="toggleEdit"
        />
        <slot name="bottom">
          <div class="bottom-content">
            <button
              type="button"
              class="btn btn-sm role-link"
              @click="save"
            >
              <i class="icon icon-checkmark" />
            </button>

            <button
              type="button"
              class="btn btn-sm role-link"
              @click="handleCancel"
            >
              <i class="icon icon-close" />
            </button>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.edit-input {
  margin: 10px;
}

.input-area {
  position: relative;

  .bottom-content {
    position: absolute;
    bottom: 0px;
    right: 2px;

    button {
      padding: 0px 4px 0px 4px;
    }
  }
}

.editText {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
  font-size: 18px;
  font-weight: 500;
  line-height: 26px;

  button {
    padding: 0px;

    text-align: center;
  }

  .icon-edit {
    margin-left: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
  }
  &:hover .icon-edit {
    opacity: 1;
  }
}
</style>
