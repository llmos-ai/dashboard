<script>
import { mapGetters } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  props: {
    fileName: {
      type:     String,
      required: true
    },
    dark: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    return { managementSettings: this.$store.getters['management/all'](MANAGEMENT.SETTING) };
  },
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),
    pl() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.PL)[0] || {};

      return setting.value;
    },

    brand() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.BRAND)[0] || {};

      return setting.value;
    },

    uiLogoLight() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.LOGO_LIGHT)[0] || {};

      return setting.value;
    },

    uiLogoDark() {
      const setting = this.managementSettings.filter((setting) => setting.id === SETTING.LOGO_DARK)[0] || {};

      return setting.value;
    },

    defaultPathToBrandedImage() {
      const themePrefix = this.theme === 'dark' ? 'dark/' : '';

      try {
        return require(`~shell/assets/images/pl/${ themePrefix }${ this.fileName }`);
      } catch {
        return require(`~shell/assets/images/pl/${ this.fileName }`);
      }
    },

    pathToBrandedImage() {
      if (this.fileName === 'logo.svg') {
        if (this.theme === 'dark' && this.uiLogoDark) {
          return this.uiLogoDark;
        }

        if (this.uiLogoLight) {
          return this.uiLogoLight;
        }
      }

      if (!this.brand) {
        return this.defaultPathToBrandedImage;
      } else {
        if (this.theme === 'dark' || this.dark) {
          try {
            return require(`~shell/assets/brand/${ this.brand }/dark/${ this.fileName }`);
          } catch {}
        }
        try {
          return require(`~shell/assets/brand/${ this.brand }/${ this.fileName }`);
        } catch {}

        return this.defaultPathToBrandedImage;
      }
    },
    getPL() {
      if (!this.pl || this.pl === '') {
        return '1BLOCK.AI';
      }

      return this.pl;
    }
  }
};
</script>
<template>
  <div class="brand-image">
    <img
      v-if="!pl"
      v-bind="$attrs"
      :src="pathToBrandedImage"
    >
    <span>{{ getPL }}</span>
  </div>
</template>
<style lang="scss" scoped>
.brand-image {
  display: flex;
  align-items: center; // Vertically centers the items
  gap: 0px;

  img {
    max-height: 40px;
    width: auto;
    max-width: 200px;
  }

  span {
    font-size: 18px;
    font-weight: 540;
    color: #4F4F50;
  }
}
</style>
