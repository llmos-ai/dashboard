<script>
import { createPopper } from '@popperjs/core';
import { get } from '@shell/utils/object';
import isString from 'lodash/isString';
import VueSelectOverrides from '@shell/mixins/vue-select-overrides';

export default {
  emits: ['dd-button-action', 'click-action'],

  mixins: [VueSelectOverrides],
  props:  {
    buttonLabel: {
      default: '',
      type:    String,
    },
    closeOnSelect: {
      default: true,
      type:    Boolean,
    },
    disabled: {
      default: false,
      type:    Boolean,
    },
    // array of option objects containing at least a label and link, but also icon and action are available
    dropdownOptions: {
      // required: true,
      default: () => [],
      type:    Array,
    },
    optionKey: {
      default: null,
      type:    String,
    },
    optionLabel: {
      default: 'label',
      type:    String,
    },
    // sm, null(med), lg - no xs...its so small
    size: {
      default: null,
      type:    String,
    },
    value: {
      default: null,
      type:    String,
    },
    placement: {
      default: 'bottom-start',
      type:    String,
    },
    selectable: {
      default: (opt) => {
        if (opt) {
          if (
            opt.disabled ||
            opt.kind === 'group' ||
            opt.kind === 'divider' ||
            opt.loading
          ) {
            return false;
          }
        }

        return true;
      },
      type: Function,
    },
  },
  data() {
    return { focused: false };
  },

  methods: {
    withPopper(dropdownList, component, { width }) {
      /**
       * We need to explicitly define the dropdown width since
       * it is usually inherited from the parent with CSS.
       */
      const componentWidth = component.$refs.search.clientWidth;
      const dropWidth = dropdownList.clientWidth;

      if (dropWidth < componentWidth) {
        dropdownList.style.width = `${ componentWidth }px`;
      } else {
        dropdownList.style.width = 'min-content';
      }

      /**
       * Here we position the dropdownList relative to the $refs.toggle Element.
       *
       * The 'offset' modifier aligns the dropdown so that the $refs.toggle and
       * the dropdownList overlap by 1 pixel.
       *
       * The 'toggleClass' modifier adds a 'drop-up' class to the Vue Select
       * wrapper so that we can set some styles for when the dropdown is placed
       * above.
       */
      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: this.placement || 'bottom-start',
        modifiers: [
          {
            name:    'offset',
            options: { offset: [-2, 2] },
          },
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          },
        ],
      });

      /**
       * To prevent memory leaks Popper needs to be destroyed.
       * If you return function, it will be called just before dropdown is removed from DOM.
       */
      return () => popper.destroy();
    },
    ddButtonAction(option) {
      this.focusSearch();
      this.$emit('dd-button-action', option);
    },
    getOptionLabel(option) {
      if (isString(option)) {
        return option;
      }

      if (this.$attrs['get-option-label']) {
        return this.$attrs['get-option-label'](option);
      }

      if (get(option, this.optionLabel)) {
        if (this.localizedLabel) {
          return this.$store.getters['i18n/t'](get(option, this.optionLabel));
        } else {
          return get(option, this.optionLabel);
        }
      } else {
        return option;
      }
    },

    onFocus() {
      return this.onFocusLabeled();
    },

    onFocusLabeled() {
      this.focused = true;
    },

    onBlur() {
      return this.onBlurLabeled();
    },

    onBlurLabeled() {
      this.focused = false;
    },

    focusSearch() {
      this.$nextTick(() => {
        const el = this.$refs['button-dropdown'].searchEl;

        if (el) {
          el.focus();
        }
      });
    },
    get,
  },
};
</script>

<template>
  <v-select
    ref="button-dropdown"
    class="button-dropdown btn"
    :class="{
      disabled,
      focused,
    }"
    v-bind="$attrs"
    :append-to-body="true"
    :calculate-position="withPopper"
    :searchable="false"
    :clearable="false"
    :close-on-select="closeOnSelect"
    :filterable="false"
    :modelValue="buttonLabel"
    :options="dropdownOptions"
    :map-keydown="mappedKeys"
    :get-option-key="
      (opt) => (optionKey ? get(opt, optionKey) : getOptionLabel(opt))
    "
    :get-option-label="(opt) => getOptionLabel(opt)"
    :selectable="selectable"
    @search:blur="onBlur"
    @search:focus="onFocus"
    @update:modelValue="$emit('click-action', $event)"
  >
    <template #no-options>
      <slot name="no-options" />
    </template>

    <template #selected-option="option">
      <a-button
        tabindex="-1"
        data-testid="dropdown-button"
        @click="ddButtonAction(option)"
        @focus="focusSearch"
      >
        {{ option.label }}
      </a-button>
    </template>
    <!-- Pass down templates provided by the caller -->
    <template
      v-for="(_, slot) of $slots"
      #[slot]="scope"
      :key="slot"
    >
      <template
        v-if="slot !== 'selected-option' && typeof $slots[slot] === 'function'"
      >
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>
    </template>
  </v-select>
</template>

<style lang="scss" scoped>
.button-dropdown.btn-sm {
  :deep() > .vs__dropdown-toggle {
    .vs__actions {
      &:after {
        font-size: 1.6rem;
      }
    }
  }
}
.button-dropdown.btn-lg {
  :deep() > .vs__dropdown-toggle {
    .vs__actions {
      &:after {
        font-size: 2.6rem;
      }
    }
  }
}
.button-dropdown {
  background: var(--accent-btn);
  border: solid 1px var(--link);
  color: var(--link);
  padding: 0;

  &.vs--open :deep() {
    outline: none;
    box-shadow: none;
  }

  &:hover {
    :deep() .vs__dropdown-toggle .vs__actions,
    :deep() .vs__selected-options {
      background: var(--accent-btn-hover);
    }
    :deep() .vs__selected-options .vs__selected button {
      background-color: transparent;
      color: var(--accent-btn-hover-text);
    }
    :deep() .vs__dropdown-toggle .vs__actions {
      &:after {
        color: var(--accent-btn-hover-text);
      }
    }
  }

  :deep() > .vs__dropdown-toggle {
    width: 100%;
    display: grid;
    grid-template-columns: 75% 25%;
    border: none;
    background: transparent;

    .vs__actions {
      &:after {
        color: var(--link);
        line-height: 1;
      }
    }
  }

  :deep() .vs__selected-options {
    .vs__selected {
      margin: unset;
      border: none;

      button {
        border: none;
        background: transparent;
        color: var(--link);
      }
    }
    .vs__search {
      // if you need to keep the dd open you can toggle these on and off
      // display: none;
      // visibility: hidden;
      position: absolute;
      opacity: 0;
      padding: 0;
    }
  }

  :deep() .vs__dropdown-menu {
    min-width: unset;
    width: fit-content;
  }
}
</style>
