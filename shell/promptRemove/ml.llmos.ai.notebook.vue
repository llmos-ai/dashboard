<script setup>
import { computed, ref, watch, toRefs } from 'vue';
import { useStore } from 'vuex';
import { resourceNames } from '@shell/utils/string';
import { useI18n } from '@shell/composables/useI18n';
import { ANNOTATIONS } from '@shell/config/labels-annotations';

const props = defineProps({
  value: {
    type:    Array,
    default: () => [],
  },
  names: {
    type:    Array,
    default: () => [],
  },
  type: {
    type:     String,
    required: true,
  },
  close: {
    type:     Function,
    required: true
  },
});

const { value, names, type } = toRefs(props);

const store = useStore();
const { t } = useI18n(store);

const checkedList = ref([]);
const checkAll = ref(true);

const removeNameArr = computed(() => {
  const out = {};

  value.value.forEach((crd) => {
    const volumes = crd.spec.volumeClaimTemplates || [];
    const volNames = volumes.map((volume) => {
      return `${ volume.metadata.name }-notebook-${ crd.name }-0`;
    });

    out[crd.id] = volNames;
  });

  return out;
});

const plusMore = computed(() => {
  // TODO: use resourceNames function
  const count = names.value.length - 5;

  return t('promptRemove.andOthers', { count }, true);
});

watch(removeNameArr, (neu) => {
  if (value.value.length === 1) {
    const keys = Object.values(neu[value.value[0].id]);

    console.log('🚀 ~ watch ~ value:', value, keys);

    checkedList.value = keys;
  }
}, { immediate: true, deep: true });

const remove = async(buttonDone) => {
  try {
    await Promise.all(value.value.map(async(resource) => {
      let onDeleteVolumes = '';

      if (value.value.length > 1) {
        if (checkAll.value) {
          onDeleteVolumes = removeNameArr.value[resource.id].join(',');
        }
      } else {
        onDeleteVolumes = checkedList.value.join(',');
      }

      resource.setAnnotation(ANNOTATIONS.ON_DELETE_VOLUMES, onDeleteVolumes);
      const res = await resource.save();

      if (res) {
        res.remove();
      }

      props.close(buttonDone);
    }));
  } catch (err) {
    // parentComponent.error = err;
    buttonDone(false);

    return Promise.reject(err);
  }
};

defineExpose({ remove });
</script>

<template>
  <div class="mt-10">
    {{ t('promptRemove.attemptingToRemove', { type }) }}
    <span v-clean-html="resourceNames(names, plusMore, t)" />

    <div class="mt-10 mb-5">
      {{ t('mlWorkload.promptRemove.title') }}
    </div>

    <div v-if="value.length === 1">
      <span
        v-for="name in removeNameArr[value[0].id]"
        :key="name"
      >
        <label class="checkbox-container mr-15">
          <a-checkbox-group
            v-model:value="checkedList"
            :options="removeNameArr[value[0].id]"
          />
        </label>
      </span>
    </div>

    <div v-else>
      <label class="checkbox-container mr-15">
        <a-checkbox
          v-model:checked="checkAll"
          type="checkbox"
        />
        {{ t('mlWorkload.promptRemove.deleteAll') }}
      </label>
    </div>
  </div>
</template>
