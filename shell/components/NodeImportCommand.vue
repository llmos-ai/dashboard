<script>
import { Banner } from '@shell/components/Banner';
import InfoBox from '@shell/components/InfoBox.vue';
import { Checkbox } from '@shell/components/form/Checkbox';
import CopyCode from '@shell/components/CopyCode.vue';
import { LabeledInput } from '@shell/components/form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Taints from '@shell/components/form/Taints.vue';
import { MANAGEMENT, NODE, SECRET } from '@shell/config/types';
import { sanitizeKey, sanitizeIP, sanitizeValue } from '@shell/utils/string';
import { allHash } from '@shell/utils/promise';
import { SETTING } from '@shell/config/settings';
import jsyaml from 'js-yaml';

export default {
  components: {
    Banner, Checkbox, CopyCode, InfoBox, KeyValue, LabeledInput, Taints,
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await allHash({
      nodes:       this.$store.dispatch(`${ inStore }/findAll`, { type: NODE }),
      serverUrl:   this.$store.dispatch(`${ inStore }/find`, { type: MANAGEMENT.SETTING, id: SETTING.SERVER_URL }),
      tokenSecret: this.$store.dispatch(`${ inStore }/find`, { type: SECRET, id: 'llmos-system\/local-k8s-state' }),
    });

    const url = hash.serverUrl?.value;

    this.serverUrl = url.replace(':8443', ':6443'); // Replace port with k3s API server port:6443
    this.tokenSecret = hash.tokenSecret?.data;
  },

  data() {
    return {
      showAdvanced:       false,
      server:             false,
      worker:             true,
      insecure:           false,
      address:            '',
      internalAddress:    '',
      nodeName:           '',
      labels:             [],
      taints:             [],
      configOut:          [],
      tokenSecret:        null,
      serverUrl:          '',
      installationScript: 'curl -sfL https://get-llmos.1block.ai |',
      skipDownloadBinary: false,
      useMirror:          false,
      llmosConfig:        {},
    };
  },

  computed: {
    llmosConfigCommand() {
      if (!this.showAdvanced) {
        return '';
      }

      this.llmosConfig = {};

      if (this.nodeName) this.llmosConfig.nodeName = this.nodeName;
      if (this.address) this.llmosConfig.address = sanitizeIP(this.address);
      if (this.internalAddress) this.llmosConfig.internalAddress = sanitizeIP(this.internalAddress);

      // Process labels
      if (this.labels && this.labels.length !== 0) {
        this.llmosConfig.labels = Object.entries(this.labels).reduce((arr, [key, value]) => {
          const k = sanitizeKey(key);
          const v = sanitizeValue(value);

          if (k && v) arr.push(`${ k }=${ v }`);

          return arr;
        }, []);
      }

      // Process taints
      if (this.taints && this.taints.length !== 0) {
        this.llmosConfig.taints = this.taints.reduce((arr, t) => {
          const k = sanitizeKey(t.key);
          const v = sanitizeValue(t.value);
          const e = sanitizeValue(t.effect);

          if (k && v && e) arr.push(`${ k }=${ v }:${ e }`);

          return arr;
        }, []);
      }

      // Return early if advanced config is empty
      if (this.isEmptyObject(this.llmosConfig)) return '';

      // Add server and token information if present
      if (this.serverUrl) this.llmosConfig.server = this.serverUrl;
      if (this.tokenSecret) {
        const decodedToken = atob(this.tokenSecret.serverToken);

        this.llmosConfig.token = decodedToken;
      }

      if (this.useMirror) this.llmosConfig.mirror = 'cn';

      // Determine role based on server presence
      this.llmosConfig.role = this.server ? 'server' : 'agent';

      const parsed = jsyaml.dump(this.llmosConfig);
      const result = `mkdir -p /etc/llmos
cat > /etc/llmos/config.yaml << EOF
${ parsed.replace(/`/g, '\\`') }
EOF`;

      return result;
    },

    linuxCommand() {
      const out = [this.installationScript];

      if (this.skipDownloadBinary) out.push('INSTALL_LLMOS_SKIP_DOWNLOAD=true');
      out.push('sh -s -');

      // Use LLMOS config file if is presented
      if (!this.isEmptyObject(this.llmosConfig) && this.showAdvanced) {
        return out.join(' ');
      }

      if (this.serverUrl) out.push(`--server ${ this.serverUrl }`);
      if (this.tokenSecret) {
        const decodedToken = atob(this.tokenSecret.serverToken);

        out.push(`--token ${ decodedToken }`);
      }
      if (this.useMirror) out.push('--mirror cn');

      if (this.server) out.push('--role server');

      return out.join(' ');
    },

    linuxDetailTitle() {
      const stepCount = this.showAdvanced ? Object.keys(this.llmosConfig).length : 0;

      return this.t('cluster.custom.registrationCommand.linuxDetail', { step: stepCount });
    },
  },

  methods: {
    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
    },

    isEmptyObject(obj) {
      return Object.keys(obj).length === 0 && obj.constructor === Object;
    }
  },
};

</script>

<template>
  <div>
    <InfoBox
      :step="1"
      class="step-box"
    >
      <h3 v-t="'cluster.custom.nodeRole.label'" />
      <h4 v-t="'cluster.custom.nodeRole.detail'" />
      <Checkbox
        v-model:value="server"
        label-key="model.machine.role.server"
      />
      <Checkbox
        v-model:value="worker"
        label-key="model.machine.role.worker"
      />
      <Banner
        v-if="!server && !worker"
        data-testid="node-role-warning"
        color="warning"
        :label="t('cluster.custom.nodeRole.warning')"
      />
    </InfoBox>

    <InfoBox
      v-if="showAdvanced"
      :step="2"
      class="step-box"
    >
      <h3 v-t="'cluster.custom.advanced.label'" />
      <h4 v-t="'cluster.custom.advanced.detail'" />

      <div class="row mb-10">
        <div class="col span-4">
          <LabeledInput
            v-model:value="nodeName"
            label-key="cluster.custom.advanced.nodeName"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="address"
            label-key="cluster.custom.advanced.publicIp"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model:value="internalAddress"
            label-key="cluster.custom.advanced.privateIp"
          />
        </div>
      </div>

      <KeyValue
        v-model:value="labels"
        class="mb-10"
        mode="edit"
        :title="t('cluster.custom.advanced.nodeLabel.title')"
        :add-label="t('cluster.custom.advanced.nodeLabel.label')"
        :read-allowed="false"
      />

      <Taints
        v-model:value="taints"
        class="mb-10"
        mode="edit"
        :value="taints"
      />

      <a
        v-t="'generic.hideAdvanced'"
        @click="toggleAdvanced"
      />
    </InfoBox>

    <div
      v-else
      class="mb-20"
    >
      <a
        v-t="'generic.showAdvanced'"
        @click="toggleAdvanced"
      />
    </div>

    <InfoBox
      :step="showAdvanced ? 3 : 2"
      class="step-box"
    >
      <h3 v-t="'cluster.custom.registrationCommand.label'" />

      <div v-if="showAdvanced && llmosConfigCommand !== ''">
        <h4 v-t="'cluster.custom.registrationCommand.saveLLMOSConfig'" />
        <CopyCode
          id="copiedConfig"
          class="m-10"
        >
          <div class="llmos-config">
            {{ llmosConfigCommand }}
          </div>
        </CopyCode>
        <hr>
      </div>

      <h4>{{ linuxDetailTitle }}</h4>
      <CopyCode
        id="copiedLinux"
        class="m-10 p-10"
      >
        {{ linuxCommand }}
      </CopyCode>
      <Checkbox
        v-model:value="skipDownloadBinary"
        class="row mb-5"
        label-key="cluster.custom.registrationCommand.skipDownloadBinary"
      />
      <Checkbox
        v-model:value="useMirror"
        class="row"
        label-key="cluster.custom.registrationCommand.useMirror"
      />
      <h5 class="row mt-20">
        <t
          k="cluster.custom.registrationCommand.moreConfigs"
          :raw="true"
        />
      </h5>
    </InfoBox>
  </div>
</template>
<style lang="scss" scoped>
  #copiedConfig{
    min-width: 400px;
    padding: 2px 10px;

    .llmos-config {
      padding: 1px 5px 5px 5px;
      white-space: pre-line;
    }
  }
</style>
