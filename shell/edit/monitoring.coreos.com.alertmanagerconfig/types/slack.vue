<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { Banner } from '@components/Banner';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import CodeMirror from '@shell/components/CodeMirror.vue';

export const DEFAULT_TEMPLATE = `{{- define "slack.llmos.text" -}}
{{ template "llmos.text_multiple" . }}
{{- end -}}
{{- define "llmos.text_multiple" -}}
*[GROUP - Details]*
One or more alarms in this group have triggered a notification.
{{- if gt (len .GroupLabels.Values) 0 }}
*Group Labels:*
  {{- range .GroupLabels.SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- if .ExternalURL }}
*Link to AlertManager:* {{ .ExternalURL }}
{{- end }}
{{- range .Alerts }}
{{ template "llmos.text_single" . }}
{{- end }}
{{- end -}}
{{- define "llmos.text_single" -}}
{{- if .Labels.alertname }}
*[ALERT - {{ .Labels.alertname }}]*
{{- else }}
*[ALERT]*
{{- end }}
{{- if .Labels.severity }}
*Severity:* \`{{ .Labels.severity }}\`
{{- end }}
{{- if .Labels.cluster }}
*Cluster:*  {{ .Labels.cluster }}
{{- end }}
{{- if .Annotations.summary }}
*Summary:* {{ .Annotations.summary }}
{{- end }}
{{- if .Annotations.message }}
*Message:* {{ .Annotations.message }}
{{- end }}
{{- if .Annotations.description }}
*Description:* {{ .Annotations.description }}
{{- end }}
{{- if .Annotations.runbook_url }}
*Runbook URL:* <{{ .Annotations.runbook_url }}|:spiral_note_pad:>
{{- end }}
{{- with .Labels }}
{{- with .Remove (stringSlice "alertname" "severity" "cluster") }}
{{- if gt (len .) 0 }}
*Additional Labels:*
  {{- range .SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
{{- with .Annotations }}
{{- with .Remove (stringSlice "summary" "message" "description" "runbook_url") }}
{{- if gt (len .) 0 }}
*Additional Annotations:*
  {{- range .SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
{{- end -}}
{{ template "slack.llmos.text" . }}
`;

export default {
  components: {
    CodeMirror,
    Banner,
    Checkbox,
    LabeledInput,
    SimpleSecretSelector,
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    namespace: {
      type:    String,
      default: ''
    }
  },
  data() {
    this.value['httpConfig'] = this.value.httpConfig || {};
    this.value['sendResolved'] = this.value.sendResolved || false;

    if (this.mode === _CREATE) {
      this.$set(
        this.value,
        'text',
        this.value.text || DEFAULT_TEMPLATE,
      );
    }

    return {
      view:              _VIEW,
      initialSecretKey:  this.value?.apiURL?.key ? this.value.apiURL.key : '',
      initialSecretName: this.value.apiURL?.name ? this.value.apiURL.name : '',
      none:              '__[[NONE]]__',
    };
  },

  methods: {
    updateSecretName(name) {
      const existingKey = this.value.apiURL?.key || '';

      if (this.value.apiURL) {
        if (name === this.none) {
          delete this.value.apiURL;
        } else {
          this.value.apiURL = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['apiURL'] = {
          key: '',
          name
        };
      }
    },
    updateSecretKey(key) {
      const existingName = this.value.apiURL?.name || '';

      if (this.value.apiURL) {
        this.value.apiURL = {
          key,
          name: existingName
        };
      } else {
        this.value['apiURL'] = {
          key,
          name: ''
        };
      }
    },

    onInput(val) {
      this.value.text = val;
    },
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>Target</h3>
        <p class="helper-text mb-5">
          <t
            k="monitoringReceiver.slack.info"
            :raw="true"
          />
        </p>
      </div>
    </div>
    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialSecretKey"
        :mode="mode"
        :initial-name="initialSecretName"
        :tooltip="t('alertmanagerConfigReceiver.slack.apiUrlTooltip')"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.slack.apiUrl')"
        @updateSecretName="updateSecretName"
        @updateSecretKey="updateSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.channel"
          :mode="mode"
          label="Default Channel"
          placeholder="e.g. #example"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.httpConfig.proxyURL"
          :mode="mode"
          label="Proxy URL"
          placeholder="e.g. http://my-proxy/"
        />
      </div>
    </div>
    <div class="row mb-10">
      <Checkbox
        v-model:value="value.sendResolved"
        :mode="mode"
        label="Enable send resolved alerts"
      />
    </div>
    <p class="mb-5">
      Text Template:
    </p>
    <div class="mb-10">
      <div class="col col-12">
        <CodeMirror
          ref="cm"
          :value="value.text"
          :options="{
            mode: 'yaml',
            lineNumbers: true,
            lineWrapping: true,
          }"
          @onInput="onInput"
        />
      </div>
    </div>
  </div>
</template>
