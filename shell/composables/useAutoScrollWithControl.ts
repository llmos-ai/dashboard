import { ref, Ref } from 'vue';
import { useIntersectionObserver } from '@vueuse/core';

export default function useAutoScrollWithControl(
  scrollContainer: Ref<HTMLElement>,
  observerTarget: Ref<HTMLElement>
) {
  const shouldAutoScroll = ref(true);

  const { stop, resume } = useIntersectionObserver(
    observerTarget,
    ([{ isIntersecting }]) => {
      if (!isIntersecting && scrollContainer.value && shouldAutoScroll.value) {
        observerTarget.value.scrollIntoView();
        // const containerRect = scrollContainer.value.getBoundingClientRect();
        // const targetRect = observerTarget.value.getBoundingClientRect();
        // const scrollTop = scrollContainer.value.scrollTop;
        // const offsetTop = targetRect.top - containerRect.top + scrollTop;
        // scrollContainer.value.scrollTo({
        //   top: offsetTop,
        //   behavior: 'smooth',
        // });
      }
    },
    {
      root: scrollContainer.value,
    }
  );

  const toggleAutoScroll = (isScroll: boolean) => {
    shouldAutoScroll.value = isScroll;
  };

  return {
    stop,
    resume,
    toggleAutoScroll,
  };
}
