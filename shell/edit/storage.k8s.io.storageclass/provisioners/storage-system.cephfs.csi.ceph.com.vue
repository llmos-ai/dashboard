<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _CREATE } from '@shell/config/query-params';

export default {
  components: { KeyValue },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },
  data() {
    if (this.mode === _CREATE) {
      this.value['parameters'] = {clusterID:                                               'storage-system',
        fsName:                                                  null,
        pool:                                                    null,
        'csi.storage.k8s.io/controller-expand-secret-name':      'rook-csi-cephfs-provisioner',
        'csi.storage.k8s.io/controller-expand-secret-namespace': 'storage-system',
        'csi.storage.k8s.io/fstype':                             'ext4',
        'csi.storage.k8s.io/node-stage-secret-name':             'rook-csi-cephfs-node',
        'csi.storage.k8s.io/node-stage-secret-namespace':        'storage-system',
        'csi.storage.k8s.io/provisioner-secret-name':            'rook-csi-cephfs-provisioner',
        'csi.storage.k8s.io/provisioner-secret-namespace':       'storage-system',};
    }

    return {};
  },
};
</script>
<template>
  <KeyValue
    v-model:value="value.parameters"
    :add-label="t('storageClass.longhorn.addLabel')"
    :read-allowed="false"
    :mode="mode"
  />
</template>
