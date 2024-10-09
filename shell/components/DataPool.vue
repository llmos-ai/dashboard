<script>
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { REPLICATED, ERASURE_CODED } from '@shell/edit/ceph.rook.io.cephblockpool.vue';

export default {
  components: {
    UnitInput,
    LabeledSelect,
    LabeledInput,
  },

  props: {
    data: {
      type:     Object,
      required: true,
    },

    isView: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    let type = 'Erasure Coded';

    if (this.data.replicated?.size > 0) {
      type = 'Replicated';
    }

    return {
      REPLICATED,
      ERASURE_CODED,
      type,
    };
  },

  methods: {}
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6 mb-10">
        <LabeledInput
          v-model="data.name"
          label="Name"
          required
          :disabled="isView"
        />
      </div>

      <div class="col span-6 mb-10">
        <LabeledSelect
          v-model="data.failureDomain"
          label="Failure Domain"
          :options="['host', 'osd']"
          :disabled="isView"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6 mb-10">
        <LabeledSelect
          v-model="type"
          label="Type"
          :options="['Replicated', 'Erasure Coded']"
          required
          :disabled="isView"
        />
      </div>

      <div
        v-if="type === REPLICATED"
        class="col span-6 mb-10"
      >
        <UnitInput
          v-model="data.replicated.size"
          :hide-unit="true"
          label="Replicas Per Failure Domain"
          required
          :disabled="isView"
        />
      </div>
    </div>

    <div
      v-if="type === ERASURE_CODED"
      class="row"
    >
      <div class="col span-6 mb-10">
        <UnitInput
          v-model="data.erasureCoded.dataChunks"
          :hide-unit="true"
          label="Data Chunks"
          :disabled="isView"
          required
        />
      </div>
      <div class="col span-6 mb-10">
        <UnitInput
          v-model="data.erasureCoded.codingChunks"
          :hide-unit="true"
          label="Coding Chunks"
          :disabled="isView"
          required
        />
      </div>
    </div>
  </div>
</template>
