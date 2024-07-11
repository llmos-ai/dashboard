// This plugin loads any UI Plugins at app load time
export default async function(context) {
  if (process.env.excludeOperatorPkg === 'true') {
    return;
  }
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
