<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Select from '@shell/components/form/Select.vue';

const props = defineProps({
  mode:     { type: String, default: '' },
  showIcon: { type: Boolean, default: true },
});

const store = useStore();
const { t } = useI18n(store);

const selectedLocaleLabel = computed(() => store.getters['i18n/selectedLocaleLabel']);
const availableLocales = computed(() => store.getters['i18n/availableLocales']);

const dev = computed(() => store.getters['prefs/dev']);

const allAvailableLocales = computed(() => {
  if (!!process.env.dev && dev.value) {
    return {
      ...availableLocales.value,
      none: 'None',
    };
  }

  return availableLocales.value;
});

const localesOptions = computed(() => Object.keys(allAvailableLocales.value).map((value) => ({
  label: t(`locale.${ value }`),
  value,
}))
);

const selectedOption = computed(() => {
  const option = Object.keys(allAvailableLocales.value)[
    Object.values(allAvailableLocales.value).indexOf(selectedLocaleLabel.value)
  ];

  return option;
});

const showLocale = computed(() => {
  return (allAvailableLocales.value && Object.keys(allAvailableLocales.value).length > 1) || dev.value;
});

const switchLocale = (event) => {
  store.dispatch('i18n/switchTo', event);
};
</script>

<template>
  <div>
    <div v-if="mode === 'login'">
      <div
        v-if="showLocale"
        role="menu"
        :aria-label="t('locale.menu')"
        class="locale-login-container"
      >
        <a-dropdown trigger="click">
          <a
            class="cursor-pointer"
            @click.prevent
          >
            {{ selectedLocaleLabel }}
            <i
              v-if="showIcon"
              class="icon icon-fw icon-sort-down"
            />
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item
                v-for="(label, name) in allAvailableLocales"
                :key="name"
                @click.stop="switchLocale(name)"
              >
                {{ label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
    <div v-else>
      <Select
        v-model:value="selectedOption"
        :options="localesOptions"
        @update:modelValue="switchLocale"
      />
    </div>
  </div>
</template>
