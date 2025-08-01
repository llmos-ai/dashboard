<script>
import { mapGetters } from 'vuex';
import { AUTO, CENTER, fitOnScreen } from '@shell/utils/position';
import { isAlternate } from '@shell/utils/platform';
import IconOrSvg from '@shell/components/IconOrSvg';

const HIDDEN = 'hide';
const CALC = 'calculate';
const SHOW = 'show';

export default {
  name:       'ActionMenu',
  components: { IconOrSvg },
  props:      {
    customActions: {
      // Custom actions can be used if you need the action
      // menu to work for something that is not a Kubernetes
      // resource, for example, a receiver within an
      // AlertmanagerConfig.

      // This prop can also be used to avoid
      // a dependency on Vuex. For now, this component can have
      // its state controlled by either props OR by Vuex, but if it
      // gets unwieldy, it could later be split into two components,
      // one with the dependency on Vuex and one without.
      type:    Array,
      default: () => {
        return [];
      },
    },
    open: {
      // Use this prop to show and hide the action menu if
      // you want to avoid an unnecessary dependency on Vuex.

      // Note: There are known issues with performance if this component
      // is included with every row of a table, so don't do that.
      // Instead the ActionMenu component can be included once on a page,
      // and then if you click on a list item, that can change
      // the menu's target so that it can open in different locations.
      type:    Boolean,
      default: false,
    },
    useCustomTargetElement: {
      // The custom target element can be a
      // variable in the component state of a list or detail page
      // if you don't want a dependency on Vuex.
      // Then when an action menu button is clicked, it can emit an event
      // that triggers the target to be set to the clicked element,
      // so that the dropdown menu can open where the context menu
      // was clicked.
      // This flag tells the component to look for and use the
      // custom target element.
      type:    Boolean,
      default: false,
    },
    customTargetElement: {
      type:    HTMLElement,
      default: null,
    },
    customTargetEvent: {
      // The event details from the user's click can be used
      // for positioning the menu on the page.
      type:    [PointerEvent, MouseEvent],
      default: null,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'action-menu',
    },
  },

  data() {
    return { phase: HIDDEN, style: {} };
  },

  computed: {
    ...mapGetters({
      // Use either these Vuex getters
      // OR the props to set the action menu state,
      // but don't use both.
      targetElem:  'action-menu/elem',
      targetEvent: 'action-menu/event',
      shouldShow:  'action-menu/showing',
      options:     'action-menu/options',
    }),

    showing() {
      return this.phase !== HIDDEN;
    },
    menuOptions() {
      if (this.customActions.length > 0) {
        return this.customActions;
      }

      return this.options;
    },
  },

  watch: {
    shouldShow: {
      handler(show) {
        if (show) {
          this.phase = CALC;
          this.updateStyle();
          this.$nextTick(() => {
            if (this.phase === CALC) {
              this.phase = SHOW;
              this.updateStyle();
            }
          });
        } else {
          this.phase = HIDDEN;
        }
      },
    },

    open() {
      // This component has a timing issue where the
      // mounted size of the expanded menu is used to
      // calculate where its position should be. That means
      // it won't work if the style is a computed property,
      // so we put a watcher here to update the style instead.
      this.updateStyle();
    },

    '$route.path'(val, old) {
      this.hide();
    },
  },

  methods: {
    hide() {
      if (this.useCustomTargetElement) {
        // If the show/hide state is controlled
        // by props, emit an event to close the menu.
        this.$emit('close');
      } else {
        // If the show/hide state is controlled
        // by Vuex, mutate the store to close the menu.
        this.$store.commit('action-menu/hide');
      }
    },

    updateStyle() {
      if (this.phase === SHOW && !this.useCustomTargetElement) {
        const menu = this.$el?.querySelector && this.$el.querySelector('.menu');
        const event = this.targetEvent;
        const elem = this.targetElem;

        // If the action menu state is controlled with Vuex,
        // use the target element and the target event
        // to position the menu.
        this.style = fitOnScreen(menu, elem || event, {
          overlapX:  true,
          fudgeX:    elem ? -2 : 0,
          fudgeY:    elem ? 20 : 0,
          positionX: elem ? AUTO : CENTER,
          positionY: AUTO,
        });
        this.style.visibility = 'visible';

        return;
      }

      if (this.open && this.useCustomTargetElement) {
        const menu = this.$el?.querySelector && this.$el.querySelector('.menu');
        const elem = this.customTargetElement;

        // If the action menu state is controlled with
        // props, use the target element to position the menu.
        this.style = fitOnScreen(
          menu,
          elem,
          {
            overlapX:  true,
            fudgeX:    elem ? 4 : 0,
            fudgeY:    elem ? 4 : 0,
            positionX: elem ? AUTO : CENTER,
            positionY: AUTO,
          },
          true
        );

        this.style.visibility = 'visible';

        return;
      }

      this.style = {};
    },

    execute(action, event, args) {
      if (action.disabled) {
        return;
      }

      // this will come from extensions...
      if (action.invoke) {
        const fn = action.invoke;

        if (fn && action.enabled) {
          const resources = this.$store.getters['action-menu/resources'];
          const opts = {
            event,
            action,
            isAlt: isAlternate(event),
          };

          if (resources.length === 1) {
            fn.apply(this, [opts, resources]);
          }
        }
      } else if (this.useCustomTargetElement) {
        // If the state of this component is controlled
        // by props instead of Vuex, we assume you wouldn't want
        // the mutation to have a dependency on Vuex either.
        // So in that case we use events to execute actions instead.
        // If an action list item is clicked, this
        // component emits that event, then we assume the parent
        // component will execute the action.
        this.$emit(action.action, {
          action,
          event,
          ...args,
          route: this.$route,
        });
      } else {
        // If the state of this component is controlled
        // by Vuex, mutate the store when an action is clicked.
        const opts = { alt: isAlternate(event) };

        this.$store.dispatch('action-menu/execute', {
          action,
          args,
          opts,
        });
      }

      this.hide();
    },

    hasOptions(options) {
      return options.length !== undefined ? options.length : Object.keys(options).length > 0;
    },
  },
};
</script>

<template>
  <div v-if="showing || open">
    <div
      class="background"
      @click="hide"
      @contextmenu.prevent
    />

    <a-menu
      class="menu"
      :style="style"
    >
      <template
        v-for="(opt, i) in menuOptions"
        :key="i"
      >
        <a-menu-divider v-if="opt.divider" />
        <a-menu-item
          v-else
          :disabled="opt.disabled"
          :data-testid="componentTestid + '-' + i + '-item'"
          @click="execute(opt, $event)"
        >
          <div class="flex align-center">
            <IconOrSvg
              v-if="opt.icon || opt.svg"
              :icon="opt.icon"
              :src="opt.svg"
              class="icon pr-[8px]"
              color="header"
            />
            <span v-clean-html="opt.label" />
          </div>
        </a-menu-item>
      </template>

      <a-menu-item
        v-if="!hasOptions(menuOptions)"
        class="no-actions"
      >
        <span v-t="'sortableTable.noActions'" />
      </a-menu-item>
    </a-menu>
  </div>
</template>

<style lang="scss" scoped>
.root {
  position: absolute;
}

.menu {
  position: absolute;
  visibility: hidden;
  top: 0;
  left: 0;
  z-index: z-index("dropdownContent");
  min-width: 145px;
  color: var(--dropdown-text);

  :deep(.ant-menu-item) {
    padding: 5px 12px;
    height: 32px;
    display: flex;
    align-items: center;
    margin: 2px 4px;

    .ant-menu-title-content {
      height: 22px;
      line-height: 22px;
      display: flex;
      align-items: center;
    }
  }
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  z-index: z-index("dropdownOverlay");
}
</style>
