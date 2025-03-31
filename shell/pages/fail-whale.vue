<script>
import BrandImage from '@shell/components/BrandImage';
import { mapState } from 'vuex';
import { stringify } from '@shell/utils/error';

export default {
  layout: 'home',

  components: { BrandImage },

  data() {
    const store = this.$store;

    if (!store.state.error && !store.state.cameFromError) {
      store.commit('cameFromError');
      this.$router.replace('/');
    }

    return { previousRoute: '' };
  },

  computed: {
    ...mapState(['error']),

    home() {
      return this.$router.resolve({ name: 'home' }).href;
    },

    displayError() {
      return this.error?.data ? this.error.data : stringify(this.error);
    },
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.previousRoute = from;
    });
  },
};
</script>

<template>
  <div v-if="error">
    <main class="main-layout error">
      <div class="text-center">
        <BrandImage
          file-name="error-desert-landscape.svg"
          width="900"
          height="300"
        />
        <h1 v-if="error.status">
          HTTP Error {{ error.status }}: {{ error.statusText }}
        </h1>
        <h1 v-else>
          Error
        </h1>
        <h2
          v-if="error"
          class="text-secondary mt-20"
        >
          {{ displayError }}
        </h2>
        <p class="mt-20">
          <a-button :href="home">
            {{ t('nav.home') }}
          </a-button>
        </p>
        <a-divider
          style="border-color: #1677ff"
          dashed
        >
          {{
            t('nav.failWhale.separator')
          }}
        </a-divider>
        <p class="mt-20">
          <a-button @click="$router.push(previousRoute.fullPath)">
            {{ t('nav.failWhale.reload') }}
          </a-button>
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.error {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  overflow: hidden;

  .row {
    align-items: center;
  }

  h1 {
    font-size: 5rem;
  }

  .desert-landscape {
    img {
      max-width: 100%;
    }
  }
}
</style>
