<script>
import jsyaml from 'js-yaml';
import { mapPref, DIFF } from '@shell/store/prefs';
import isEmpty from 'lodash/isEmpty';
import { saferDump } from '@shell/utils/create-yaml';
import CodeMirror from './CodeMirror';
import FileDiff from './FileDiff';

export const EDITOR_MODES = {
  EDIT_CODE: 'EDIT_CODE',
  VIEW_CODE: 'VIEW_CODE',
  DIFF_CODE: 'DIFF_CODE',
};

export default {
  components: {
    CodeMirror,
    FileDiff,
  },
  props: {
    editorMode: {
      type:    String,
      default: EDITOR_MODES.EDIT_CODE,
      validator(value) {
        return Object.values(EDITOR_MODES).includes(value);
      },
    },

    asObject: {
      type:    Boolean,
      default: false,
    },

    initialYamlValues: {
      type:    [String, Object],
      default: '',
    },

    scrolling: {
      type:    Boolean,
      default: true,
    },

    value: {
      type:    [String, Object],
      default: '',
    },

    hidePreviewButtons: {
      type:    Boolean,
      default: false,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'yaml-editor',
    },

    // Allow the editor to be disabled
    disabled: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    const { initialYamlValues, value } = this;
    let curValue;
    let original;

    if (this.asObject) {
      curValue = saferDump(value);
    } else {
      curValue = value || '';
    }

    if (this.asObject && initialYamlValues) {
      original = saferDump(initialYamlValues);
    } else {
      original = initialYamlValues;
    }

    if (isEmpty(original)) {
      original = value;
    }

    return { original, curValue };
  },

  computed: {
    codeMirrorOptions() {
      const readOnly = this.editorMode === EDITOR_MODES.VIEW_CODE;

      const gutters = [];

      if (!readOnly) {
        gutters.push('CodeMirror-lint-markers');
      }

      gutters.push('CodeMirror-foldgutter');

      return {
        readOnly,
        gutters,
        mode:            'yaml',
        lint:            !readOnly,
        lineNumbers:     !readOnly,
        styleActiveLine: true,
        tabSize:         2,
        indentWithTabs:  false,
        cursorBlinkRate: readOnly ? -1 : 530,
        extraKeys:       {
          'Ctrl-Space': 'autocomplete',

          Tab: (cm) => {
            if (cm.somethingSelected()) {
              cm.indentSelection('add');

              return;
            }

            cm.execCommand('insertSoftTab');
          },

          'Shift-Tab': (cm) => {
            cm.indentSelection('subtract');
          },
        },
        // @TODO find a better way to display the outline
        // foldOptions: {
        //   widget: (from, to) => {
        //     const count = to.line - from.line;

        //     return count ? `\u21A4${ count }\u21A6` : '\u2194';
        //   }
        // }
      };
    },

    isPreview() {
      return this.editorMode === EDITOR_MODES.DIFF_CODE;
    },

    diffMode: mapPref(DIFF),

    showCodeEditor() {
      return [EDITOR_MODES.EDIT_CODE, EDITOR_MODES.VIEW_CODE].includes(
        this.editorMode
      );
    },
  },

  watch: {
    showUploadPrompt(neu) {
      if (neu) {
        this.$refs.yamluploader.click();
      }
    },
  },

  methods: {
    focus() {
      if (this.$refs.cm) {
        this.$refs.cm.focus();
      }
    },

    refresh() {
      if (this.$refs.cm) {
        this.$refs.cm.refresh();
      }
    },

    onInput(value) {
      if (!this.asObject) {
        this.$emit('input', ...arguments);
      }

      try {
        const parsed = jsyaml.load(value);

        if (this.asObject) {
          this.$emit('input', parsed);
        } else {
          this.$emit('newObject', parsed);
        }
      } catch (ex) {}

      this.$emit('onInput', ...arguments);
    },

    onReady() {
      this.$emit('onReady', ...arguments);
    },

    onChanges() {
      this.$emit('onChanges', ...arguments);
    },

    updateValue(value) {
      this.curValue = value;
      this.$refs.cm.updateValue(value);
    },
  },
};
</script>

<template>
  <div class="yaml-editor">
    <div class="text-right">
      <a-space
        v-if="isPreview && !hidePreviewButtons"
        v-trim-whitespace
        class="mt-10"
      >
        <a-radio-group
          v-model:value="diffMode"
          size="small"
        >
          <a-radio-button value="unified">
            Unified
          </a-radio-button>
          <a-radio-button value="split">
            Split
          </a-radio-button>
        </a-radio-group>
      </a-space>
    </div>
    <CodeMirror
      v-if="showCodeEditor"
      ref="cm"
      :class="{ fill: true, scrolling: scrolling }"
      :value="curValue"
      :options="codeMirrorOptions"
      :disabled="disabled"
      :data-testid="componentTestid + '-code-mirror'"
      @onInput="onInput"
      @onReady="onReady"
      @onChanges="onChanges"
    />
    <FileDiff
      v-else
      :class="{ fill: true, scrolling: scrolling }"
      :filename="'.yaml'"
      :side-by-side="diffMode === 'split'"
      :orig="original"
      :neu="curValue"
      :footer-space="80"
    />
  </div>
</template>

<style lang="scss" scoped>
.yaml-editor {
  display: flex;
  flex-direction: column;

  .fill {
    flex: 1;
  }

  :deep() .code-mirror {
    position: relative;

    .CodeMirror {
      background-color: var(--yaml-editor-bg);
      & .CodeMirror-gutters {
        background-color: var(--yaml-editor-bg);
      }
    }
  }

  .d2h-file-wrapper {
    border-top-right-radius: 0;
  }
}
</style>
