<script>
import LabeledInput from '@shell/components/form/LabeledInput/LabeledInput.vue';
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
    },
    showName: {
      type:    Boolean,
      default: true
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

  watch: {
    type(neu) {
      if (neu === 'Replicated') {
        this.data['replicated'] = { size: 3 };
        delete this.data['erasureCoded'];
      } else {
        this.data['erasureCoded'] = { dataChunks: 2, codingChunks: 1 };
        delete this.data['replicated'];
      }
    }
  }

};
</script>

<template>
  <div>
    <div
      v-if="showName"
      class="row"
    >
      <div class="col span-6 mb-10">
        <LabeledInput
          v-model:value="data.name"
          label="Name"
          required
          :disabled="isView"
        />
      </div>

      <div class="col span-6 mb-10">
        <LabeledSelect
          v-model:value="data.failureDomain"
          label="Failure Domain"
          :options="['host', 'osd']"
          :disabled="isView"
          required
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6 mb-10">
        <LabeledSelect
          v-model:value="type"
          label="Type"
          :options="['Replicated', 'Erasure Coded']"
          required
          :disabled="isView"
        />
      </div>

      <div
        v-if="!showName"
        class="col span-6 mb-10"
      >
        <LabeledSelect
          v-model:value="data.failureDomain"
          label="Failure Domain"
          :options="['host', 'osd']"
          :disabled="isView"
          required
        />
      </div>

      <div
        v-if="showName && type === REPLICATED"
        class="col span-6 mb-10"
      >
        <UnitInput
          v-model:value="data.replicated.size"
          :hide-unit="true"
          label="Replicas Per Failure Domain"
          required
          :disabled="isView"
        />
      </div>
    </div>

    <div
      v-if="!showName && type === REPLICATED"
      class="row"
    >
      <div class="col span-6 mb-10">
        <UnitInput
          v-model:value="data.replicated.size"
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
          v-model:value="data.erasureCoded.dataChunks"
          :hide-unit="true"
          label="Data Chunks"
          :disabled="isView"
          required
        />
      </div>

      <div class="col span-6 mb-10">
        <UnitInput
          v-model:value="data.erasureCoded.codingChunks"
          :hide-unit="true"
          label="Coding Chunks"
          :disabled="isView"
          required
        />
      </div>
    </div>
  </div>
</template>
