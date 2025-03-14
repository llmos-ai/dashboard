<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { decodeHtml } from '@shell/utils/string';

export default {
  components: {
    AsyncButton,
    Banner,
  },
  props: {
    applyAction: {
      type: Function,
      default: () => {},
    },
    applyMode: {
      type: String,
      default: 'create',
    },
    title: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },

    /**
     * Callback to identify response of the prompt
     */
    confirm: {
      type: Function,
      default: () => {},
    },
  },
  data() {
    return { errors: [] };
  },

  methods: {
    decodeHtml,
    close() {
      this.confirm(false);
      this.$emit('close', false);
    },

    async apply(buttonDone) {
      try {
        await this.applyAction(buttonDone);
        this.confirm(true);
        this.$emit('close', true);
      } catch (err) {
        console.error(err); // eslint-disable-line
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    },
  },
};
</script>

<template>
  <a-card :title="title">
    <slot name="body">
      <div
        v-clean-html="decodeHtml(body)"
        class="pl-10 pr-10"
        style="min-height: 50px; display: flex"
      />
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
    </slot>

    <template #actions>
      <a-button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </a-button>

      <AsyncButton :mode="applyMode" type="primary" danger @click="apply" />
    </template>
  </a-card>
</template>
