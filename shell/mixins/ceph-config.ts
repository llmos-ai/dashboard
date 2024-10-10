import Vue from 'vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

export default Vue.extend({
  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    isView() {
      return this.mode === _VIEW;
    },

    managedWarning() {
      const { value } = this;
      const url = '/c/local/llmos/management.llmos.ai.managedaddon/storage-system/llmos-ceph-cluster?mode=edit';
      const managedWarning = {
        show: this.isLLMOSRelease,
        type: value?.kind || '',
        url,
      };

      return this.t('ceph.managedWarning', managedWarning, 'html');
    },

    isLLMOSRelease() {
      return this.annotations?.['meta.helm.sh/release-name'] === 'llmos-ceph-cluster';
    },

    options() {
      return [{ label: 'true', value: true }, { label: 'false', value: false }];
    }
  }
});
