
import vSelect from 'vue-select';
import simplebar from 'simplebar-vue';
import 'simplebar-vue/dist/simplebar.min.css';

/**
 * Add components to the Vue instance
 * @param {*} vueApp Vue instance
 */
export const installComponents = (vueApp) => {
  // Vendor components
  vueApp.component('v-select', vSelect);
  vueApp.component('simplebar', simplebar);
};
