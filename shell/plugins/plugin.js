// This plugin loads any UI Plugins at app load time
import { allHashSettled } from '@shell/utils/promise';

export default async function(context) {
  if (process.env.excludeOperatorPkg === 'true') {
    return;
  }

  const hash = {};

  // Provide a mechanism to load the UI without the plugins loaded - in case there is a problem
  let loadPlugins = true;

  const queryKeys = Object.keys(context.route?.query || {}).map((q) => q.toLowerCase());

  if (queryKeys.includes('safemode')) {
    console.warn('Safe Mode - plugins will not be loaded'); // eslint-disable-line no-console
    setTimeout(() => {
      context.store.dispatch('growl/success', {
        title:   context.store.getters['i18n/t']('plugins.safeMode.title'),
        message: context.store.getters['i18n/t']('plugins.safeMode.message')
      }, { root: true });
    }, 1000);
  }

  return true;
}
