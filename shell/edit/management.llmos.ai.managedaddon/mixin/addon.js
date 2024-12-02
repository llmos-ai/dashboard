import { _VIEW } from '@shell/config/query-params';
import { systemAddonLabel } from '@shell/models/management.llmos.ai.managedaddon';
import jsyaml from 'js-yaml';

export default {
  name:  'ManagedAddonMixin',
  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  data() {
    const spec = this.value.spec;
    const enabled = this.$route.query.enabled;

    if (enabled !== undefined) {
      spec.enabled = enabled === 'true';
    }

    if (!spec.valuesContent && spec.defaultValuesContent?.length > 0) {
      spec.valuesContent = spec.defaultValuesContent;
    }

    return { spec };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    allowEdit() {
      return !this.isView && !this.isSystemAddon;
    },

    isSystemAddon() {
      return this.value.metadata?.labels?.[systemAddonLabel] === 'true';
    }
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  methods: {
    willSave() {
      this.errors = [];

      if (this.spec.chart === '') {
        this.errors.push(this.t('validation.required', { key: 'Chart Name' }, true));
      }

      if (this.spec.version === '') {
        this.errors.push(this.t('validation.required', { key: 'Version' }, true));
      }

      if (this.spec.repo === '') {
        this.errors.push(this.t('validation.required', { key: 'Repo' }, true));
      }

      if (!this.validChartRepo(this.spec.repo)) {
        this.errors.push(this.t('validation.invalidChartRepo', { key: 'Repo' }, true));
      }

      // Validate yaml values
      if (this.spec.valuesContent?.length > 0) {
        try {
          jsyaml.load(this.spec.valuesContent);
        } catch (err) {
          this.errors.push(this.$store.getters['i18n/t']('validation.invalidYaml'), err);
        }
      }

      if (this.errors.length > 0) {
        return Promise.reject(this.errors);
      }

      if (this.spec.valuesContent === this.spec.defaultValuesContent) {
        this.spec.valuesContent = null;
      }
    },

    validChartRepo(url) {
      const pattern = /^(http?|https?|git):\/\/.+$/;

      return pattern.test(url);
    },
  }
};
