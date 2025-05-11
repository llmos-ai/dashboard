<script setup lang="ts">
import { RcDropdownSeparator } from '@shell/components/RcDropdown';
import { RcDropdownMenuComponentProps, DropdownOption } from './types';
import IconOrSvg from '@shell/components/IconOrSvg';

// eslint-disable-next-line vue/no-setup-props-destructure
const { buttonSize = '' } = defineProps<RcDropdownMenuComponentProps>();

const emit = defineEmits(['update:open', 'select']);

const hasOptions = (options: DropdownOption[]) => {
  return options.length !== undefined ? options.length : Object.keys(options).length > 0;
};
</script>

<template>
  <a-dropdown
    trigger="click"
    :size="buttonSize"
    :aria-label="dropdownAriaLabel"
    @update:open="(e: boolean) => emit('update:open', e)"
  >
    <a-button type="link">
      <i class="icon icon-actions" />
    </a-button>
    <template #overlay>
      <a-menu>
        <template
          v-for="(a) in options"
          :key="a.label"
        >
          <a-menu-item
            v-if="!a.divider"
            @click="(e: MouseEvent) => emit('select', e, a)"
          >
            <template #icon>
              <IconOrSvg
                v-if="a.icon || a.svg"
                :icon="a.icon"
                :src="a.svg"
                class="icon"
                color="header"
              />
            </template>
            {{ a.label }}
          </a-menu-item>
          <rc-dropdown-separator
            v-else
          />
        </template>
        <a-menu-item
          v-if="!hasOptions(options)"
          disabled
        >
          No actions available
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
