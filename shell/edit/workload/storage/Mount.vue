<script>
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { Checkbox } from '@shell/components/form/Checkbox';
import { mapGetters } from 'vuex';
import { removeObject } from '@shell/utils/array';
export default {
  name:       'Mount',
  components: { LabeledInput, Checkbox },
  props:      {
    mode: {
      type:    String,
      default: 'create',
    },

    // volume name
    name: {
      type:    String,
      default: '',
    },

    container: {
      type:     Object,
      required: true,
    },
  },

  data() {
    // 深拷贝匹配当前名称的挂载点，确保响应式追踪
    const volumeMounts = (this.container.volumeMounts || []).filter(
      (mount) => mount.name === this.name
    ).map((mount) => ({ ...mount }));

    return { volumeMounts };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  watch: {
    volumeMounts: {
      handler(neu) {
        // 创建一个新数组，保留不匹配当前名称的挂载点
        const filtered = (this.container.volumeMounts || []).filter(
          (mount) => mount.name && mount.name !== this.name
        );

        // 使用 Vue 可以检测到的方式更新数组
        this.container.volumeMounts = [...filtered, ...neu];
      },
      deep: true
    },

    name(neu) {
      this.updateMountNames(neu);
    },
  },

  created() {
    if (!this.volumeMounts.length) {
      // 添加一个新的挂载点对象
      this.volumeMounts.push({ name: this.name });
    }
  },

  methods: {
    add() {
      // 添加一个新的挂载点对象
      this.volumeMounts.push({ name: this.name });
    },

    remove(volumeMount) {
      // 使用 removeObject 工具函数移除对象
      removeObject(this.volumeMounts, volumeMount);
      // 确保触发 volumeMounts 的 watch 处理器
      this.$forceUpdate();
    },

    updateMountNames(name) {
      // 创建新的对象数组以确保响应式更新
      this.volumeMounts = this.volumeMounts.map((mount) => ({
        ...mount,
        name
      }));
    },
  },
};
</script>

<template>
  <div>
    <div
      v-if="volumeMounts.length"
      class="mount-headers"
    >
      <span>
        {{ t('workload.storage.mountPoint') }}
        <span class="text-error">*</span>
      </span>
      <span>
        {{ t('workload.storage.subPath') }}
      </span>
      <span class="read-only">
        {{ t('workload.storage.readOnly') }}
      </span>
      <span />
    </div>
    <div
      v-for="(volumeMount, i) in volumeMounts"
      :key="i"
      class="mount-rows"
    >
      <div>
        <LabeledInput
          :id="`mount-path-${i}`"
          v-model:value="volumeMount.mountPath"
          :mode="mode"
        />
      </div>
      <div>
        <LabeledInput
          v-model:value="volumeMount.subPath"
          :mode="mode"
        />
      </div>
      <div class="read-only">
        <Checkbox
          v-model:value="volumeMount.readOnly"
          :mode="mode"
        />
      </div>
      <div class="remove">
        <a-button
          v-if="mode !== 'view'"
          id="remove-mount"
          type="link"
          @click="remove(volumeMount)"
        >
          {{ t('generic.remove') }}
        </a-button>
      </div>
    </div>
    <div class="row">
      <a-button
        v-if="mode !== 'view'"
        id="add-mount"
        @click="add()"
      >
        {{ t('workload.storage.addMount') }}
      </a-button>
    </div>
  </div>
</template>

<style lang="scss">
.mount-headers,
.mount-rows {
  display: grid;
  grid-template-columns: 42% 42% 5% auto;
  grid-gap: $column-gutter;
  margin-bottom: 10px;
  align-items: center;

  .remove BUTTON {
    padding: 0px;
  }
}

.mount-headers {
  color: var(--input-label);
}
</style>
