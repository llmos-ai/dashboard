import { computed, toValue } from 'vue';

export function useModelLogo(icon) {
  const modelLogo = computed(() => {
    try {
      return require(`~shell/assets/images/model-providers/${ toValue(
        icon
      ) }-color.svg`);
    } catch (err) {
      try {
        return require(`~shell/assets/images/model-providers/${ toValue(
          icon
        ) }.svg`);
      } catch (err) {
        return require(`~shell/assets/images/model-providers/ai.svg`);
      }
    }
  });

  return { modelLogo };
}
