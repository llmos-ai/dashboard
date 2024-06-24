<script>
import Loading from '@shell/components/Loading';
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getVendor } from '@shell/config/private-label';
import { mapGetters } from 'vuex';

export default {
  layout:     'plain',
  components: { BackLink, Loading },
  mixins:     [BackRoute],
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  data() {
    return {
      dashboardVersion: this.$config.dashboardVersion,
      settings:         null,
      SETTING
    };
  },
  computed: {
    ...mapGetters(['releaseNotesUrl']),
    llmosVersion() {
      return this.settings.find((s) => s.id === SETTING.VERSION_PRODUCT);
    },
    appName() {
      return getVendor();
    },
  },
};
</script>

<template>
  <Loading v-if="!settings" />
  <div
    v-else
    class="about"
  >
    <BackLink :link="backLink" />
    <h3>{{ t('about.versions.title') }}</h3>
    <table>
      <thead>
        <tr>
          <th>{{ t('about.versions.component') }}</th>
          <th>{{ t('about.versions.version') }}</th>
        </tr>
      </thead>
      <tr v-if="llmosVersion">
        <td>
          <a
            href="https://github.com/llmos-ai/llmos-operator"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ t("about.versions.llmos") }}
          </a>
        </td><td>{{ llmosVersion.value }}</td>
      </tr>
      <tr v-if="dashboardVersion">
        <td>
          <a
            href="https://github.com/llmos-ai/dashboard"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            {{ t("generic.dashboard") }}
          </a>
        </td><td>{{ dashboardVersion }}</td>
      </tr>
    </table>
    <p class="pt-20">
      <a
        :href="releaseNotesUrl"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        {{ t('about.versions.releaseNotes') }}
      </a>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.about {
  .title-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  table {
    border-collapse: collapse;
    overflow: hidden;
    border-radius: var(--border-radius);

    tr > td:first-of-type {
      width: 20%;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 8px 5px;
      min-width: 150px;
      text-align: left;
    }

    th {
      background-color: var(--sortable-table-top-divider);
      border-bottom: 1px solid var(--sortable-table-top-divider);
    }

    a {
      cursor: pointer;
    }

    .os {
      display: flex;
      align-items: center;
    }
  }
}

</style>
