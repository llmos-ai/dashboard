import Cookie from 'universal-cookie'
import { shallowRef } from 'vue'

export function useCookies(
  vuexStore
) {
  store = vuexStore;

  if (!store) {
    throw new Error('usI18n() must be called from setup()');
  }

  return { t };
}
