<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { removeAt } from '@shell/utils/array';
import { TextAreaAutoGrow } from '@shell/components/form/TextArea';
import { clone } from '@shell/utils/object';
import { LabeledInput } from '@shell/components/form/LabeledInput';
const DEFAULT_PROTIP =
  'Tip: Paste lines into any list field for easy bulk entry';

export default {
  emits: ['add', 'remove', 'update:value'],

  components: { TextAreaAutoGrow, LabeledInput },
  props:      {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },
    title: {
      type:    String,
      default: '',
    },
    protip: {
      type:    [String, Boolean],
      default: DEFAULT_PROTIP,
    },
    showHeader: {
      type:    Boolean,
      default: false,
    },
    valueLabel: {
      type:    String,
      default: 'Value',
    },
    valuePlaceholder: {
      type:    String,
      default: 'e.g. bar',
    },
    valueMultiline: {
      type:    Boolean,
      default: false,
    },
    addIcon: {
      type:    String,
      default: '',
    },
    addLabel: {
      type:    String,
      default: '',
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },
    addDisabled: {
      type:    Boolean,
      default: false,
    },
    removeLabel: {
      type:    String,
      default: '',
    },
    removeAllowed: {
      type:    Boolean,
      default: true,
    },
    defaultAddValue: {
      type:    [String, Number, Object, Array],
      default: '',
    },
    loading: {
      type:    Boolean,
      default: false,
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
    required: {
      type:    Boolean,
      default: false,
    },
    rules: {
      default:   () => [],
      type:      Array,
      // we only want functions in the rules array
      validator: (rules) => rules.every((rule) => ['function'].includes(typeof rule)),
    },
  },
  data() {
    const input = (Array.isArray(this.value) ? this.value : []).slice();
    const rows = [];

    for (const value of input) {
      rows.push({ value });
    }
    if (!rows.length && this.initialEmptyRow) {
      const value = this.defaultAddValue ? clone(this.defaultAddValue) : '';

      rows.push({ value });
    }

    return { rows, lastUpdateWasFromValue: false };
  },
  computed: {
    _addLabel() {
      return this.addLabel || this.t('generic.add');
    },
    _removeLabel() {
      return this.removeLabel || this.t('generic.remove');
    },

    isView() {
      return this.mode === _VIEW;
    },
    showAdd() {
      return this.addAllowed;
    },
    disableAdd() {
      return this.addDisabled;
    },
    showRemove() {
      return this.removeAllowed;
    },
    isDefaultProtip() {
      return this.protip === DEFAULT_PROTIP;
    },
    showProtip() {
      if (this.protip && !this.isDefaultProtip) {
        return true;
      }

      return !this.valueMultiline && this.protip;
    },
  },
  watch: {
    value: {
      deep: true,
      handler() {
        this.lastUpdateWasFromValue = true;
        this.rows = (this.value || []).map((v) => ({ value: v }));
      },
    },

    rows: {
      deep: true,
      handler(newValue, oldValue) {
        // lastUpdateWasFromValue is used to break a cycle where when rows are updated
        // this was called which then forced rows to updated again
        if (!this.lastUpdateWasFromValue) {
          this.queueUpdate();
        }
        this.lastUpdateWasFromValue = false;
      },
    },
  },
  created() {
    this.queueUpdate = debounce(this.update, 50);
  },
  methods: {
    add() {
      this.rows.push({ value: clone(this.defaultAddValue) });
      if (this.defaultAddValue) {
        this.queueUpdate();
      }
      this.$nextTick(() => {
        const inputs = this.$refs.value;

        if (inputs && inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
        this.$emit('add');
      });
    },
    /**
     * Remove item and emits removed row and its own index value
     */
    remove(row, index) {
      this.$emit('remove', { row, index });
      removeAt(this.rows, index);
      this.queueUpdate();
    },

    /**
     * Cleanup rows and emit input
     */
    update() {
      if (this.isView) {
        return;
      }
      const out = [];

      for (const row of this.rows) {
        const trim = !this.valueMultiline && typeof row.value === 'string';
        const value = trim ? row.value.trim() : row.value;

        if (typeof value !== 'undefined') {
          out.push(value);
        }
      }
      this.$emit('update:value', out);
    },

    /**
     * Handle paste event, e.g. split multiple lines in rows
     */
    onPaste(index, event) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');

      if (this.valueMultiline) {
        // Allow to paste multiple lines
        this.rows[index].value = text;
      } else {
        // Prevent to paste the value and emit text in multiple rows
        const split = text.split('\n').map((value) => ({ value }));

        event.preventDefault();
        this.rows.splice(index, 1, ...split);
      }

      this.update();
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="title"
      class="clearfix"
    >
      <slot name="title">
        <h3>
          {{ title }}
          <span
            v-if="required"
            class="required"
          >*</span>
          <i
            v-if="showProtip"
            v-clean-tooltip="protip"
            class="icon icon-info"
          />
        </h3>
      </slot>
    </div>

    <template v-if="rows.length">
      <div v-if="showHeader">
        <slot name="column-headers">
          <label class="value text-label mb-10">
            {{ valueLabel }}
          </label>
        </slot>
      </div>
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        :data-testid="`array-list-box${idx}`"
        class="box"
      >
        <slot
          name="columns"
          :queueUpdate="queueUpdate"
          :i="idx"
          :rows="rows"
          :row="row"
          :mode="mode"
          :isView="isView"
        >
          <div class="value">
            <slot
              name="value"
              :row="row"
              :mode="mode"
              :isView="isView"
              :queue-update="queueUpdate"
            >
              <TextAreaAutoGrow
                v-if="valueMultiline"
                ref="value"
                v-model:value="row.value"
                :data-testid="`textarea-${idx}`"
                :placeholder="valuePlaceholder"
                :mode="mode"
                :disabled="disabled"
                @paste="onPaste(idx, $event)"
                @update:value="queueUpdate"
              />
              <LabeledInput
                v-else-if="rules.length > 0"
                ref="value"
                v-model:value="row.value"
                :data-testid="`labeled-input-${idx}`"
                :placeholder="valuePlaceholder"
                :disabled="isView || disabled"
                :rules="rules"
                :compact="false"
                @paste="onPaste(idx, $event)"
                @update:value="queueUpdate"
              />
              <a-input
                v-else
                ref="value"
                v-model:value="row.value"
                :data-testid="`input-${idx}`"
                :placeholder="valuePlaceholder"
                :disabled="isView || disabled"
                @paste="onPaste(idx, $event)"
              />
            </slot>
          </div>
        </slot>
        <div
          v-if="showRemove"
          class="remove"
        >
          <slot
            name="remove-button"
            :remove="() => remove(row, idx)"
            :i="idx"
            :row="row"
          >
            <a-button
              type="link"
              :disabled="isView"
              :data-testid="`remove-item-${idx}`"
              @click="remove(row, idx)"
            >
              {{ _removeLabel }}
            </a-button>
          </slot>
        </div>
      </div>
    </template>
    <div v-else>
      <slot name="empty">
        <div
          v-if="mode === 'view'"
          class="text-muted"
        >
          &mdash;
        </div>
      </slot>
    </div>
    <div
      v-if="showAdd && !isView"
      class="footer mt-20"
    >
      <slot
        v-if="showAdd"
        name="add"
        :add="add"
      >
        <a-button
          class="add"
          :disabled="loading || disableAdd"
          data-testid="array-list-button"
          @click="add()"
        >
          <i
            class="mr-5 icon"
            :class="
              loading ? ['icon-lg', 'icon-spinner', 'icon-spin'] : [addIcon]
            "
          />
          {{ _addLabel }}
        </a-button>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  margin-bottom: 10px;
}

.required {
  color: var(--error);
}

.box {
  display: grid;
  grid-template-columns: auto $array-list-remove-margin;
  align-items: center;
  margin-bottom: 10px;
  .value {
    flex: 1;
    INPUT {
      height: $unlabeled-input-height;
    }
  }
}
.remove {
  text-align: right;
}
.footer {
  .protip {
    float: right;
    padding: 5px 0;
  }
}

.required {
  color: var(--error);
}
</style>
