// Settings
interface GlobalSettingRuleset {
  name: string;
  key?: string | number;
  factoryArg?: string | number | (string | number)[];
}

interface GlobalSetting {
  [key: string]: {
    alias?: string;
    canReset?: boolean;
    customFormatter?: string;
    from?: string;
    kind?: string;
    options?: string[];
    readOnly?: boolean;
    /**
     * Function used from the form validation
     */
    ruleSet?: GlobalSettingRuleset[];
  };
}

// Adapted from: https://github.com/rancher/ui/blob/08c379a9529f740666a704b52522a468986c3520/lib/shared/addon/utils/constants.js#L564
// Setting IDs
export const SETTING = {
  VERSION_PRODUCT: 'server-version',
  VERSION_CLI: 'cli-version',
  VERSION_MACHINE: 'machine-version',
  VERSION_HELM: 'helm-version',
  CLI_URL: {
    DARWIN: 'cli-url-darwin',
    WINDOWS: 'cli-url-windows',
    LINUX: 'cli-url-linux',
  },
  CA_CERTS: 'cacerts',

  // Allow the local cluster to be hidden
  AUTH_USER_SESSION_MAX_TTL_MINUTES: 'auth-user-session-max-ttl-minutes',
  AUTH_TOKEN_MAX_TTL_MINUTES: 'auth-token-max-ttl-minutes',
  KUBECONFIG_GENERATE_TOKEN: 'kubeconfig-generate-token',
  KUBECONFIG_DEFAULT_TOKEN_TTL_MINUTES: 'kubeconfig-default-token-ttl-minutes',
  FIRST_LOGIN: 'first-login',
  SERVER_URL: 'server-url',
  PASSWORD_MIN_LENGTH: 'password-min-length', // L_PASSWORD_MIN_LENGTH
  SERVER_VERSION: 'server-version',
  DEFAULT_NOTEBOOK_IMAGES: 'default-notebook-images',
  LOG_LEVEL: 'log-level',
  UPGRADE_CHECK_ENABLED: 'upgrade-check-enabled',
  UPGRADE_CHECK_URL: 'upgrade-check-url',
  HUGGINGfACE_ENDPOINT: 'huggingface-endpoint',
  MODEL_SERVICE_DEFAULT_IMAGE: 'model-service-default-image',
  RAY_CLUSTER_DEFAULT_VERSION: 'ray-cluster-default-version',
  MANAGED_ADDON_CONFIGS: 'managed-addon-configs',
  GLOBAL_SYSTEM_IMAGE_REGISTRY: 'global-system-image-registry',

  UI_SOURCE: 'ui-source',
  UI_INDEX: 'ui-index',
  UI_ISSUES: 'ui-issues',
  PL: 'ui-pl',
  BANNERS: 'ui-banners',
  ISSUES: 'ui-issues',
  LOGO_LIGHT: 'ui-logo-light',
  LOGO_DARK: 'ui-logo-dark',
  PRIMARY_COLOR: 'ui-primary-color',
  LINK_COLOR: 'ui-link-color',
  COMMUNITY_LINKS: 'ui-community-links',
  FAVICON: 'ui-favicon',
  /**
   * Allow the backend to force a light/dark theme. Used in non-rancher world and results in the theme used
   * both pre and post log in. If not present defaults to the usual process
   */
  THEME: 'ui-theme',
  SYSTEM_NAMESPACES: 'system-namespaces',
};

// These are the settings that are allowed to be edited via the UI
export const ALLOWED_SETTINGS: GlobalSetting = {
  [SETTING.CA_CERTS]: { kind: 'multiline', readOnly: true },
  [SETTING.PASSWORD_MIN_LENGTH]: {
    kind: 'integer',
    ruleSet: [
      {
        name: 'betweenValues',
        key: 'Password',
        factoryArg: [2, 256],
      },
      {
        name: 'isInteger',
        key: 'Password',
      },
      {
        name: 'isPositive',
        key: 'Password',
      },
      {
        name: 'isOctal',
        key: 'Password',
      },
    ],
  },
  [SETTING.AUTH_TOKEN_MAX_TTL_MINUTES]: { kind: 'integer' },
  [SETTING.AUTH_USER_SESSION_MAX_TTL_MINUTES]: { kind: 'integer' },
  [SETTING.SERVER_URL]: { kind: 'url', canReset: true },
  [SETTING.HUGGINGfACE_ENDPOINT]: { kind: 'url', canReset: true },
  [SETTING.UI_INDEX]: {},
  [SETTING.GLOBAL_SYSTEM_IMAGE_REGISTRY]: { kind: 'string' },
  [SETTING.DEFAULT_NOTEBOOK_IMAGES]: { kind: 'json', canReset: true },
  [SETTING.MODEL_SERVICE_DEFAULT_IMAGE]: { kind: 'string' },
  [SETTING.UI_SOURCE]: {
    kind: 'enum',
    options: ['auto', 'external', 'bundled'],
  },
  [SETTING.LOG_LEVEL]: {
    kind: 'enum',
    options: ['info', 'debug', 'trace'],
  },
  [SETTING.PL]: { canReset: true },
  [SETTING.UPGRADE_CHECK_ENABLED]: { kind: 'boolean' },
  [SETTING.UPGRADE_CHECK_URL]: { kind: 'url' },
};

/**
 * Settings on how to handle warnings returning in api responses, specifically which to show as growls
 */
export interface PerfSettingsWarningHeaders {
  /**
   * Warning is a string containing multiple entries. This determines how they are split up
   *
   * See https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/1693-warnings#design-details
   */
  separator: string;
  /**
   * Show warnings in a notification if they're not in this block list
   */
  notificationBlockList: string[];
}

export interface PerfSettingsKubeApi {
  /**
   * Settings related to the response header `warnings` value
   */
  warningHeader: PerfSettingsWarningHeaders;
}

export interface PerfSettings {
  inactivity: {
    enabled: boolean;
    threshold: number;
  };
  incrementalLoading: {
    enabled: boolean;
    threshold: number;
  };
  manualRefresh: {};
  disableWebsocketNotification: boolean;
  garbageCollection: {};
  forceNsFilterV2: any;
  advancedWorker: {};
  kubeAPI: PerfSettingsKubeApi;
}

export const DEFAULT_PERF_SETTING: PerfSettings = {
  inactivity: {
    enabled: false,
    threshold: 900,
  },
  incrementalLoading: {
    enabled: true,
    threshold: 1500,
  },
  manualRefresh: {
    enabled: false,
    threshold: 1500,
  },

  disableWebsocketNotification: true,
  garbageCollection: {
    enabled: false,

    // When GC Runs
    enabledInterval: true,
    interval: 1 * 60 * 5,
    enabledOnNavigate: true,

    // How GC handles resources when GC'ing
    ageThreshold: 1 * 60 * 2,
    countThreshold: 500,
  },
  forceNsFilterV2: { enabled: false },
  advancedWorker: { enabled: false },
  kubeAPI: {
    /**
     * Settings related to the response header `warnings` value
     */
    warningHeader: {
      /**
       * Warning is a string containing multiple entries. This determines how they are split up
       *
       * See https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/1693-warnings#design-details
       */
      separator: '299 - ',
      /**
       * Show warnings in a notification if they're not in this block list
       */
      notificationBlockList: ['299 - unknown field'],
    },
  },
};
