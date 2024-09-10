<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  props: {
    value: {
      type:     String,
      required: true,
    },

    useMuted: {
      type:    Boolean,
      default: true,
    },

    showLabels: {
      type:    Boolean,
      default: false,
    }
  },

  async fetch() {
    this.principal = this.$store.getters['management/byId'](MANAGEMENT.USER, this.value);

    if ( this.principal ) {
      return;
    }

    const principalId = encodeURI(this.value).replace(/\//g, '%2F');

    try {
      const users = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.USER,
        opt:  { url: `/v1/${ MANAGEMENT.USER }?me=true` }
      });

      if (users && users.length === 1) {
        this.principal = users[0];
      }
    } catch (e) {
      console.error('Failed to fetch logged in user', this.value, principalId); // eslint-disable-line no-console
    }
  },

  data() {
    return { principal: null };
  },

  computed: {
    showBoth() {
      const p = this.principal;

      if (!!p.spec.username || !!p.spec.displayName) {
        return false;
      }

      return p.username.trim().toLowerCase() !== p.spec.displayName.trim().toLowerCase();
    }
  },
};
</script>

<template>
  <div
    class="principal"
    :class="{'showLabels': showLabels}"
  >
    <template v-if="!principal && $fetchState.pending">
      <div class="avatar">
        <div class="empty">
          <i class="icon icon-spinner icon-lg" />
        </div>
      </div>
      <div
        v-clean-html="t('principal.loading', null, true)"
        class="name"
        :class="{'text-muted': useMuted}"
      />
      <div class="description" />
    </template>

    <template v-else-if="principal">
      <div class="avatar">
        <img
          :src="principal.avatarSrc"
          :class="{'round': principal.roundAvatar}"
        >
      </div>
      <div
        v-if="showLabels"
        class="name"
      >
        <table>
          <tr><td>{{ t('principal.name') }}: </td><td>{{ principal.spec.displayName }}</td></tr>
          <tr><td>{{ t('principal.loginName') }}: </td><td>{{ principal.spec.username }}</td></tr>
          <tr><td>{{ t('principal.type') }}: </td><td>{{ principal.displayType }}</td></tr>
        </table>
      </div>
      <template v-else>
        <div class="name">
          <template v-if="showBoth">
            {{ principal.spec.displayName }}
            <span
              v-if="principal.spec.username"
            >({{ principal.spec.username }})</span>
          </template>
          <template v-else>
            {{ principal.spec.username }}
          </template>
        </div>
        <div class="description">
          {{ principal.displayType }}
        </div>
      </template>
    </template>

    <!--unable to fetch user-->
    <template v-else>
      <div class="avatar">
        <div
          class="empty"
          :class="{'text-muted': useMuted}"
        >
          <i class="icon icon-warning icon-lg" />
        </div>
      </div>
      <div
        v-t="'principal.error'"
        class="name text-error"
      />
      <div
        class="description"
        :class="{'text-muted': useMuted}"
      >
        {{ value }}
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $size: 40px;

  .principal {
    display: grid;
    grid-template-areas:
      "avatar name"
      "avatar description";
    grid-template-columns: $size auto;
    grid-template-rows: auto math.div($size, 2);
    column-gap: 10px;

    &.showLabels {
      grid-template-areas:
        "avatar name";
      grid-template-columns: 60px auto;
      grid-template-rows: 60px;
      column-gap: 0;
      .name {
        line-height: unset;
      }

      table tr td:not(:first-of-type) {
        padding-left: 10px;
      }
    }

    .avatar {
      grid-area: avatar;
      text-align: center;

      DIV.empty {
        border: 1px solid var(--border);
        line-height: $size;
      }

      IMG {
        width: $size;
        height: $size;
      }

      DIV.round, IMG.round {
        border-radius: 50%;
      }
    }

    .name {
      grid-area: name;
      line-height: math.div($size, 2);
      overflow-wrap: anywhere;
    }

    .description {
      grid-area: description;
      line-height: math.div($size, 2);
    }
  }
</style>
