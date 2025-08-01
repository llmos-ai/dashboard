<script>
import BannerGraphic from '@shell/components/BannerGraphic';
import IndentedPanel from '@shell/components/IndentedPanel';
import CommunityLinks from '@shell/components/CommunityLinks';
import { MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel,
    CommunityLinks
  },

  async fetch() {
    const fetchOrCreateSetting = async(id, val) => {
      let setting;

      try {
        setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
      } catch {
        const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
        const url = schema.linkFor('collection');

        setting = await this.$store.dispatch('management/create', {
          type:     MANAGEMENT.SETTING,
          metadata: { name: id },
          value:    val,
          default:  val || ''
        });

        setting.save({ url });
      }

      return setting;
    };

    this.brandSetting = await fetchOrCreateSetting(SETTING.BRAND, '');
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
    this.settings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
  },

  data() {
    return {
      hasSupport:      false,
      apps:            [],
      vendor:          getVendor(),
      supportKey:      '',
      brandSetting:    null,
      uiIssuesSetting: null,
      serverSetting:   null,
      settings:        null,
      promos:          [
        'support.promos.one',
        'support.promos.two',
        'support.promos.three',
        'support.promos.four',
      ]
    };
  },

  computed: {
    serverUrl() {
      // Client-side rendered: use the current window location
      return window.location.origin;
    },

    title() {
      return this.hasSupport ? 'support.llmos.title' : 'support.community.title';
    },

  },

};
</script>
<template>
  <div>
    <BannerGraphic :title="t(title, {}, true)" />

    <IndentedPanel>
      <div class="content mt-20">
        <div class="promo col main-panel">
          <div class="box mb-20 box-primary">
            <h2>{{ t('support.llmos.access.title') }}</h2>
            <div
              v-if="!hasSupport"
              class="external support-links mt-20"
            >
              <div class="support-link">
                <a
                  class="support-link"
                  href="https://1block.ai"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >{{ t('support.community.learnMore') }}</a>
              </div>
            </div>
          </div>
          <div class="boxes">
            <div
              v-for="(key, i) in promos"
              :key="i"
              class="box"
            >
              <h2>{{ t(`${key}.title`) }}</h2>
              <div>{{ t(`${key}.text`) }}</div>
            </div>
          </div>
        </div>
        <CommunityLinks
          :is-support-page="true"
          class="community col side-panel span-3"
        />
      </div>
    </IndentedPanel>
  </div>
</template>
<style lang="scss" scoped>
.content {

    display: flex;
    align-items: stretch;
    .col {
      margin: 0
    }
    .main-panel {
      flex: auto;
    }

    .side-panel {
      margin-left: 1.75%;
    }
  }

.toggle-support {
    height: 100%;

    &.card-container {
      box-shadow: none;
    }

    &:deep() .card-actions {
      display: flex;
      justify-content: space-between;
    }
}

.support-link:not(:first-child) {
  margin: 15px 0 0 0;
}

.register {
  display: flex;
  align-items: center;
  margin-top: 20px;
  font-size: 16px;
}
.remove-link {
  cursor: pointer;
  font-size: 14px;
}
.boxes {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 50% 50%;
  margin-right: 20px;
}

.box {
  padding: 20px;
  border: 1px solid var(--border);

  &.box-primary {
    border-color: var(--primary);
  }

  > h2 {
    font-size: 20px;
    font-weight: 300;
  }

  > div {
    font-weight: 300;
    line-height: 18px;
    opacity: 0.8;
  }
}
</style>
