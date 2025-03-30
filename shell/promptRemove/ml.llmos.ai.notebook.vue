<script>
import { mapState, mapGetters } from 'vuex';
import { isEmpty } from '@shell/utils/object';
import { resourceNames } from '@shell/utils/string';
import { ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  name: 'NotebookPromptRemove',

  props: {
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    names: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    type: {
      type:     String,
      required: true
    }
  },

  data() {
    return {
      checkedList: [],
      checkAll:    true
    };
  },

  computed: {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    removeNameArr() {
      const out = {};

      this.value.forEach((crd) => {
        const volumes = crd.spec.volumeClaimTemplates || [];
        const names = volumes.map((volume) => {
          return `${ volume.metadata.name }-notebook-${ crd.name }-0`;
        });

        out[crd.id] = names;
      });

      return out;
    },

    plusMore() {
      const count = this.names.length - this.names.length;

      return this.t('promptRemove.andOthers', { count });
    },
  },

  watch: {
    removeNameArr: {
      handler(neu) {
        if (this.value.length === 1) {
          const keys = Object.values(neu[this.value[0].id]);

          this.checkedList = keys;
        }
      },
      deep:      true,
      immediate: true
    }
  },

  methods: {
    resourceNames,
    async remove() {
      const parentComponent = this.$parent.$parent.$parent;

      let goTo;

      if (parentComponent.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...parentComponent.doneLocation };
      }

      try {
        await Promise.all(this.value.map(async(resource) => {
          let onDeleteVolumes = '';

          if (this.value.length > 1) {
            if (this.checkAll) {
              onDeleteVolumes = this.removeNameArr[resource.id].join(',');
            }
          } else {
            onDeleteVolumes = this.checkedList.join(',');
          }

          resource.setAnnotation(ANNOTATIONS.ON_DELETE_VOLUMES, onDeleteVolumes);
          const res = await resource.save();

          if (!!res) {
            res.remove();
          }

          if (goTo && !isEmpty(goTo)) {
            parentComponent.currentRouter.push(goTo);
          }
          parentComponent.close();
        }));
      } catch (err) {
        parentComponent.error = err;

        return Promise.reject(err);
      }
    }
  }
};
</script>

<template>
  <div class="mt-10">
    {{ t('promptRemove.attemptingToRemove', {type}) }}
    <span v-clean-html="resourceNames(names, plusMore, t)" />

    <div class="mt-10 mb-5">
      {{ t('mlWorkload.promptRemove.title') }}
    </div>
    <div v-if="value.length === 1">
      <span
        v-for="name in removeNameArr[value[0].id]"
        :key="name"
      >
        <label class="checkbox-container mr-15"><a-input
                                                  v-model="checkedList"
                                                  type="checkbox"
                                                  :label="name"
                                                  :value="name"
                                                />
          <span
            class="checkbox-custom mr-5"
            role="checkbox"
          />
          {{ name }}
        </label>
      </span>
    </div>

    <div v-else>
      <label class="checkbox-container mr-15"><a-input
                                                v-model:value="checkAll"
                                                type="checkbox"
                                              />
        <span
          class="checkbox-custom mr-5"
          role="checkbox"
        />
        {{ t('mlWorkload.promptRemove.deleteAll') }}
      </label>
    </div>
  </div>
</template>
