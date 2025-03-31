<script setup>
import { ref, computed, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { isEmpty } from '@shell/utils/object';
import { resourceNames } from '@shell/utils/string';
import { ANNOTATIONS } from '@shell/config/labels-annotations';
import { exceptionToErrorsArray } from '@shell/utils/error';

const props = defineProps({
  value: {
    type:    Array,
    default: () => []
  },
  names: {
    type:    Array,
    default: () => []
  },
  type: {
    type:     String,
    required: true
  },
  close: {
    type:     Function,
    required: true
  },
});

const store = useStore();
const t = computed(() => store.getters['i18n/t']);

const checkedList = ref([]);
const checkAll = ref(true);

const removeNameArr = computed(() => {
  const out = {};

  props.value.forEach((crd) => {
    const volumes = crd.spec.volumeClaimTemplates || [];
    const names = volumes.map((volume) => `${ volume.metadata.name }-modelservice-${ crd.name }-0`);

    out[crd.id] = names;
  });

  return out;
});

const plusMore = computed(() => {
  const count = props.names.length - props.names.length;

  return t.value('promptRemove.andOthers', { count });
});

// watch(removeNameArr, (neu) => {
//   if (props.value.length === 1) {
//     checkedList.value = Object.values(neu[props.value[0].id]);
//   }
// }, { deep: true, immediate: true });

const instance = getCurrentInstance();
const remove = async(buttonDone) => {
  const parentComponent = instance.proxy.$parent.$parent.$parent;
  let goTo;

  if (parentComponent.doneLocation) {
    goTo = { ...parentComponent.doneLocation };
  }

  try {
    await Promise.all(props.value.map(async(resource) => {
      let deleteVolumes = '';

      if (props.value.length > 1) {
        if (checkAll.value) {
          deleteVolumes = removeNameArr.value[resource.id].join(',');
        }
      } else {
        deleteVolumes = checkedList.value.join(',');
      }

      resource.setAnnotation(ANNOTATIONS.ON_DELETE_VOLUMES, deleteVolumes);
      const res = await resource.save();

      if (res) res.remove();

      if (goTo && !isEmpty(goTo)) {
        parentComponent.currentRouter.push(goTo);
      }
      props.close(buttonDone);
    }));
  } catch (err) {
    parentComponent.error = err;
    props.errors = exceptionToErrorsArray(err);
    buttonDone(false);
    // return Promise.reject(err);
  }
};

defineExpose({ remove });
</script>

<template>
  <div>
    {{ t('promptRemove.attemptingToRemove', { type }) }}
    <span v-clean-html="resourceNames(names, plusMore, t)" />

    <div class="mt-10 mb-5">
      {{ t('mlWorkload.promptRemove.title') }}
    </div>

    <div v-if="value.length === 1">
      <a-checkbox-group
        v-model:value="checkedList"
        :options="removeNameArr[value[0].id]"
      />
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
