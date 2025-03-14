<script>
import InstallRedirect from '@shell/utils/install-redirect';
import AlertTable from '@shell/components/AlertTable';
import { NAME, ADDON_NAME, ADDON_NAMESPACE } from '@shell/config/product/monitoring';
import { MANAGEMENT, MONITORING } from '@shell/config/types';
import { findBy } from '@shell/utils/array';
import LazyImage from '@shell/components/LazyImage';
import SimpleBox from '@shell/components/SimpleBox';
import { canViewAlertManagerLink, canViewGrafanaLink, canViewPrometheusLink } from '@shell/utils/monitoring';

export default {
  components: {
    LazyImage,
    SimpleBox,
    AlertTable
  },

  middleware: InstallRedirect(NAME, ADDON_NAME),

  async fetch() {
    await this.fetchDeps();
  },

  data() {
    const monitorConfigSrc = require('@shell/assets/images/vendor/monitor-config.svg');
    const grafanaSrc = require('@shell/assets/images/vendor/grafana.svg');
    const prometheusSrc = require('@shell/assets/images/vendor/prometheus.svg');
    const currentCluster = this.$store.getters['currentCluster'];

    return {
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      resources:     [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUS],
      externalLinks: [
        {
          enabled:     true,
          group:       'config',
          iconSrc:     monitorConfigSrc,
          label:       'monitoring.overview.linkedList.config.label',
          description: 'monitoring.overview.linkedList.config.description',
          link:        `/c/${ currentCluster.id }/llmos/${ MANAGEMENT.MANAGED_ADDON }/${ ADDON_NAMESPACE }/${ ADDON_NAME }?mode=edit`,
          internal:    true,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusPromQl.label',
          description:
            'monitoring.overview.linkedList.prometheusPromQl.description',
          link: '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-prometheus:9090/proxy/graph',
        },
        {
          enabled:     false,
          group:       'grafana',
          iconSrc:     grafanaSrc,
          label:       'monitoring.overview.linkedList.grafana.label',
          description: 'monitoring.overview.linkedList.grafana.description',
          link:        '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-grafana:80/proxy',
        },
        {
          enabled:     false,
          group:       'alertmanager',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.alertManager.label',
          description:
            'monitoring.overview.linkedList.alertManager.description',
          link: '/api/v1/namespaces/llmos-monitoring-system/services/http:llmos-monitoring-alertmanager:9093/proxy',
        },
      ]
    };
  },

  methods: {
    async fetchDeps() {
      const { externalLinks } = this;
      const canViewAlertManager = await canViewAlertManagerLink(this.$store);
      const canViewGrafana = await canViewGrafanaLink(this.$store);
      const canViewPrometheus = await canViewPrometheusLink(this.$store);

      if (canViewAlertManager) {
        const amMatch = findBy(externalLinks, 'group', 'alertmanager');

        amMatch.enabled = true;
      }

      if (canViewGrafana) {
        const grafanaMatch = findBy(externalLinks, 'group', 'grafana');

        grafanaMatch.enabled = true;
      }

      if (canViewPrometheus) {
        const promeMatch = externalLinks.filter(
          (el) => el.group === 'prometheus'
        );

        promeMatch.forEach((match) => {
          match.enabled = true;
        });
      }
    },
  },
};
</script>

<template>
  <section>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="monitoring.overview.title" />
        </h1>
        <div>
          <t
            k="monitoring.overview.subtitle"
            :raw="true"
          />
        </div>
      </div>
    </header>
    <div>
      <div class="create-resource-container">
        <div class="subtypes-container">
          <router-link
            v-for="fel in externalLinks"
            :key="fel.label"
            v-clean-tooltip="
              !fel.enabled ? t('monitoring.overview.linkedList.na') : undefined
            "
            :href="fel.enabled ? fel.link : void 0"
            :disabled="!fel.enabled"
            :target="fel.internal ? '_self' : '_blank'"
            rel="noopener noreferrer"
            :to="fel.link"
            :class="{ 'subtype-banner': true, disabled: !fel.enabled }"
          >
            <div class="subtype-content">
              <div class="title">
                <div class="subtype-logo round-image image-container">
                  <LazyImage :src="fel.iconSrc" />
                </div>
                <h5>
                  <span>
                    <t :k="fel.label" />
                  </span>
                </h5>
                <div
                  v-if="!fel.internal"
                  class="flex-right"
                >
                  <i class="icon icon-external-link" />
                </div>
              </div>
              <hr>
              <div class="description">
                <span>
                  <t :k="fel.description" />
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    <div>
      <SimpleBox
        class="mt-30"
        :title="t('monitoring.overview.alertsList.label')"
      >
        <AlertTable />
      </SimpleBox>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.create-resource-container .subtype-banner {
  min-height: 80px;
  padding: 10px;
}

.subtype-content{
    /* Ensure the container allows the image to fit properly */
  .subtype-logo {
    display: flex;
    justify-content: center; /* Center horizontally */
    align-items: center;    /* Center vertically if height is specified */
    overflow: hidden;       /* Hide overflow if the image is too large */

    img {
      max-width: 100%;        /* Ensure the image does not exceed the container's width */
      height: auto;
      padding: 0.2rem;
    }
  }

  h5 {
    padding: 0.2rem;
  }

  .description {
    padding: 0.1rem 0.2rem;
  }
}

</style>
