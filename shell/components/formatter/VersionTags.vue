<script>
export default {
  props: {
    value: {
      type:    [String, Array],
      default: ''
    },
    row: {
      type:    Object,
      default: () => {}
    },
    col: {
      type:    Object,
      default: () => {}
    }
  },
  computed: {
    versions() {
      if (!this.value || this.value === '-') {
        return [];
      }

      // 如果是字符串，按逗号分隔
      if (typeof this.value === 'string') {
        return this.value.split(',').map((v) => v.trim()).filter((v) => !!v);
      }

      // 如果是数组，直接返回
      if (Array.isArray(this.value)) {
        return this.value;
      }

      return [];
    },

    // 格式化版本号，确保有 v 前缀
    formattedVersions() {
      return this.versions.map((version) => {
        // 如果版本号已经有 v 前缀，直接返回
        if (version.toString().startsWith('v')) {
          return version;
        }

        // 否则添加 v 前缀
        return `v${ version }`;
      }).sort((a, b) => {
        // 提取数字部分进行排序
        const numA = parseInt(a.toString().replace(/^v/, '')) || 0;
        const numB = parseInt(b.toString().replace(/^v/, '')) || 0;

        return numA - numB;
      });
    }
  }
};
</script>

<template>
  <span>
    <template v-if="versions.length === 0">
      <!-- {{ t('generic.none') }} -->
    </template>
    <template v-else>
      <a-tag
        v-for="(version, i) in formattedVersions"
        :key="i"
        class="mr-5"
      >
        {{ version }}
      </a-tag>
    </template>
  </span>
</template>
