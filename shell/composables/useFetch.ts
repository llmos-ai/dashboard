import {
  ref, onMounted, toRefs, watch, toValue
} from 'vue';
import { useStore } from 'vuex';

export default function useFetch(url, params = {}, options = {}, defaultData = []) {
  const store = useStore();
  const data = ref(defaultData);
  const error = ref(null);
  const loading = ref(true);

  const fetchData = async() => {
    try {
      const fullOptions = {
        url:     toValue(url),
        method:  'get',
        params:  { ...params },
        headers: { 'Content-Type': 'application/json' },
        ...options
      };

      const response = await store.dispatch('cluster/request', fullOptions);

      console.log('🚀 ~ fetchData ~ store:', store);
      // const response = await store.dispatch('request', fullOptions);

      console.log('🚀 ~ fetchData ~ result:', response);

      data.value = response;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchData);

  watch(() => toValue(url), () => {
    loading.value = true;
    fetchData();
  });

  return {
    ...toRefs({
      data, error, loading
    })
  };
}
