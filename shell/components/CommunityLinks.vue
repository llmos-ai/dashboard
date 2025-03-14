<script>
import SimpleBox from '@shell/components/SimpleBox';
import Closeable from '@shell/mixins/closeable';
import { mapGetters } from 'vuex';
import { fetchLinks } from '@shell/config/home-links';

export default {
  name: 'CommunityLinks',

  components: { SimpleBox },

  props: {
    linkOptions: {
      type: Object,
      default: () => {
        return {};
      },
    },
    isSupportPage: {
      type: Boolean,
      default: false,
    },
  },

  mixins: [Closeable],

  async fetch() {
    this.links = await fetchLinks(
      this.$store,
      false,
      this.isSupportPage,
      (str) => this.t(str)
    );
  },

  data() {
    return { links: {} };
  },

  computed: {
    ...mapGetters('i18n', ['selectedLocaleLabel']),

    hasOptions() {
      return (
        !!Object.keys(this.options).length || !!Object.keys(this.$slots).length
      );
    },

    options() {
      // Use linkOptions if provided - used by Harvester
      if (this.linkOptions && Object.keys(this.linkOptions).length) {
        const options = [];

        Object.keys(this.linkOptions).forEach((key) => {
          options.push({
            key,
            label: this.t(key),
            value: this.linkOptions[key],
          });
        });

        return options;
      }

      // Combine the links
      const all = [];

      if (this.links.custom) {
        all.push(...this.links.custom);
      }

      if (this.links.defaults) {
        all.push(...this.links.defaults.filter((link) => link.enabled));
      }

      return all;
    },
  },
  methods: {
    show() {
      this.$modal.show('wechat-modal');
    },
    close() {
      this.$modal.hide('wechat-modal');
    },
  },
};
</script>

<template>
  <div v-if="hasOptions">
    <SimpleBox :pref="pref" :pref-key="prefKey">
      <template #title>
        <h2>
          {{ t('customLinks.displayTitle') }}
        </h2>
      </template>
      <div v-for="(link, i) in options" :key="i" class="support-link">
        <router-link v-if="link.value.startsWith('/')" :to="link.value">
          {{ link.label }}
        </router-link>
        <a-button
          v-else
          type="link"
          rel="noopener noreferrer nofollow"
          :href="link.value"
          target="_blank"
        >
          {{ link.label }}
        </a-button>
      </div>
      <slot />
    </SimpleBox>
  </div>
</template>

<style lang="scss" scoped>
h2 {
  display: flex;
  align-items: center;

  i {
    font-size: 12px;
    margin-left: 5px;
  }
}

.link {
  cursor: pointer;
}

.btn {
  margin: 20px auto 0;
}

.qr-img {
  //background-image: url('../assets/images/wechat-qr-code.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  height: 128px;
  width: 128px;
  margin: 15px auto 10px;
}
</style>
