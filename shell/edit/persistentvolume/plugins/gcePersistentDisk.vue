<script>
import { LabeledInput } from '@shell/components/form/LabeledInput';
import { RadioGroup } from '@shell/components/form/Radio';

export default {
  components: { LabeledInput, RadioGroup },
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
  },
  data() {
    this.value.spec['gcePersistentDisk'] = this.value.spec.gcePersistentDisk || {};
    this.value.spec.gcePersistentDisk['readOnly'] = this.value.spec.gcePersistentDisk.readOnly || false;
    this.value.spec.gcePersistentDisk['partition'] = this.value.spec.gcePersistentDisk.partition || 0;

    const readOnlyOptions = [
      {
        label: this.t('generic.yes'),
        value: true
      },
      {
        label: this.t('generic.no'),
        value: false
      }
    ];

    return { readOnlyOptions };
  },
  computed: {
    partition: {
      get() {
        return this.value.spec.gcePersistentDisk.partition;
      },
      set(value) {
        this.value.spec.gcePersistentDisk['partition'] = Number.parseInt(value, 10);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.gcePersistentDisk.pdName"
          :mode="mode"
          :label="t('persistentVolume.gcePersistentDisk.persistentDiskName.label')"
          :placeholder="t('persistentVolume.gcePersistentDisk.persistentDiskName.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="partition"
          :mode="mode"
          :label="t('persistentVolume.shared.partition.label')"
          :placeholder="t('persistentVolume.azureFile.secretName.placeholder')"
          type="number"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.spec.gcePersistentDisk.fsType"
          :mode="mode"
          :label="t('persistentVolume.shared.filesystemType.label')"
          :placeholder="t('persistentVolume.shared.filesystemType.placeholder')"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model:value="value.spec.gcePersistentDisk.readOnly"
          name="readOnly"
          :mode="mode"
          :label="t('persistentVolume.shared.readOnly.label')"
          :options="readOnlyOptions"
          :row="true"
        />
      </div>
    </div>
  </div>
</template>
