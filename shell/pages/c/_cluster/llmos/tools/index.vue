<script>
import { mapGetters } from 'vuex';
import Loading from '@shell/components/Loading';
import { ENABLED } from '@shell/config/query-params';
import LazyImage from '@shell/components/LazyImage';
import TabTitle from '@shell/components/TabTitle';
import { MANAGEMENT } from '@shell/config/types';
import { CLUSTER_TOOLS, DESCRIPTION } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter.vue';

export default {
  components: {
    BadgeStateFormatter,
    LazyImage,
    Loading,
    TabTitle,
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({ addons: this.$store.dispatch(`${ inStore }/findAll`, { type: MANAGEMENT.MANAGED_ADDON }) });

    this.addons = hash.addons;
  },

  data() {
    return { addons: [] };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...mapGetters({ t: 'i18n/t' }),

    clusterAddons() {
      return this.addons.filter((addon) => {
        return addon.metadata.labels[CLUSTER_TOOLS] === 'true';
      });
    },
  },

  methods: {
    description(row) {
      return row.metadata.annotations[DESCRIPTION];
    },

    disable(addon) {
      const route = addon.editUrl;

      route.query[ENABLED] = 'false';
      this.$router.replace(route);
    },
  },
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h1>
      <TabTitle>{{ t('typeLabel."llmos.tool"', { count: 2 }) }}</TabTitle>
    </h1>

    <div class="grid">
      <div
        v-for="(addon, i) in clusterAddons"
        :key="i"
        class="item"
        :data-testid="`cluster-tools-app-${addon.id}`"
      >
        <div class="logo">
          <i
            v-if="addon.iconName"
            class="icon"
            :class="addon.iconName"
          />
          <LazyImage
            v-else
            :src="addon.logo"
          />
        </div>
        <div class="name-version">
          <div>
            <router-link :to="addon.editUrl">
              <h3 class="name">
                {{ addon.formatName }}
              </h3>
              <div class="state">
                <BadgeStateFormatter :row="addon" />
              </div>
            </router-link>
          </div>
          <div class="version">
            {{ addon.version }}
          </div>
        </div>
        <div class="description">
          <div
            v-clean-html="addon.description"
            class="description-content"
          />
        </div>
        <div class="action">
          <template v-if="addon.blocked">
            <a-button
              v-clean-html="t('managedAddon.tools.action.install')"
              disabled="true"
              type="primary"
              size="small"
            />
          </template>
          <template v-else-if="addon.spec.enabled">
            <a-button
              v-clean-html="t('managedAddon.tools.action.disable')"
              type="primary"
              size="small"
              @click="disable(addon)"
            />
            <router-link :to="addon.editUrl">
              <a-button
                v-clean-html="t('managedAddon.tools.action.edit')"
                type="primary"
                size="small"
              />
            </router-link>
          </template>
          <template v-else>
            <router-link :to="addon.editUrl">
              <a-button
                v-clean-html="t('managedAddon.tools.action.install')"
                type="primary"
                size="small"
              />
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$margin: 10px;
$logo: 50px;

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1 * $margin;

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .item {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .item {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .item {
      width: calc(50% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .item {
      width: calc(33.33333% - 2 * #{$margin});
    }
  }

  .item {
    display: grid;
    grid-template-areas:
      'logo name-version name-version'
      'description description description'
      'state state action';
    grid-template-columns: $logo auto min-content;
    grid-template-rows: 50px 55px 35px;
    row-gap: $margin;
    column-gap: $margin;

    margin: $margin;
    padding: $margin;
    position: relative;
    border: 1px solid var(--border);
    border-radius: calc(1.5 * var(--border-radius));

    .logo {
      grid-area: logo;
      text-align: center;
      width: $logo;
      height: $logo;
      border-radius: calc(2 * var(--border-radius));
      overflow: hidden;
      background-color: white;

      img {
        width: $logo - 4px;
        height: $logo - 4px;
        object-fit: contain;
        position: relative;
        top: 2px;
      }

      > i {
        background-color: var(--box-bg);
        border-radius: 50%;
        font-size: 32px;
        line-height: 50px;
        width: 50px;
      }
    }

    .name-version {
      grid-area: name-version;
      padding: 10px 0 0 0;
    }

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      float: left;
      padding: 0 5px 0 0;
    }

    .state {
      grid-area: state;
    }

    .version {
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.9em;
      margin-top: 4px;
    }

    .description {
      grid-area: description;
    }

    .description-content {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-muted);
    }

    .action {
      grid-area: action;
      white-space: nowrap;

      button {
        height: 30px;
      }
    }
  }
}
</style>
