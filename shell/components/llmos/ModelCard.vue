<script>
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';

export default {
  name: 'ModelCard',

  components: {
    BadgeStateFormatter,
    LiveDate,
    ActionMenu,
  },

  props: {
    row: {
      type:     Object,
      required: true,
    },

    testIdPrefix: {
      type:    String,
      default: 'model'
    },

    defaultIcon: {
      type:    String,
      default: '/img/generic-catalog.svg'
    },

    descriptionField: {
      type:    String,
      default: 'spec.modelCard.description'
    },

    fallbackDescriptionField: {
      type:    String,
      default: null
    },

    showActions: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    iconUrl() {
      return this.row.iconUrl || this.defaultIcon;
    },

    description() {
      const getValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };

      const primaryDesc = getValue(this.row, this.descriptionField);

      if (primaryDesc) {
        return primaryDesc;
      }

      if (this.fallbackDescriptionField) {
        return getValue(this.row, this.fallbackDescriptionField);
      }

      return '';
    }
  },

};
</script>

<template>
  <div
    class="item pb-0"
    :data-testid="`${testIdPrefix}-${row.id}`"
  >
    <div class="logo">
      <img
        class="size-[20px] mr-2"
        :src="iconUrl"
      >
    </div>
    <div class="name-version">
      <div class="d-flex">
        <router-link :to="row.detailLocation">
          <h3 class="name">
            {{ row.id }}
          </h3>
        </router-link>
        <div class="state">
          <BadgeStateFormatter :row="row" />
        </div>
      </div>
      <div class="text-muted">
        <LiveDate
          :value="row.creationTimestamp"
          :add-suffix="true"
          :show-tooltip="false"
        />
      </div>
    </div>
    <div class="action">
      <ActionMenu
        :resource="row"
      />
    </div>
    <div class="description mt-10">
      {{ description }}
    </div>
    <div
      v-if="showActions"
      class="actions"
    >
      <slot
        name="actions"
        :row="row"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$margin: 10px;
$logo: 50px;

.item {
  display: grid;
  grid-template-areas:
    'logo name-version action'
    'description description description'
    'actions actions actions';
  grid-template-columns: $logo auto min-content;
  grid-template-rows: 50px 115px auto;
  row-gap: 5px;
  column-gap: $margin;

  margin: $margin;
  padding: $margin;
  position: relative;
  border: 1px solid var(--border);
  border-radius: calc(1.5 * var(--border-radius));

  .logo {
    grid-area: logo;
    text-align: center;
    width: $logo;
    height: $logo;
    border-radius: calc(2 * var(--border-radius));
    overflow: hidden;
    background-color: white;

    img {
      width: $logo - 4px;
      height: $logo - 4px;
      object-fit: contain;
      position: relative;
      top: 2px;
    }

    > i {
      background-color: var(--box-bg);
      border-radius: 50%;
      font-size: 32px;
      line-height: 50px;
      width: 50px;
    }
  }

  .name-version {
    grid-area: name-version;
    padding: 5px 0 0 0;

    .d-flex {
      display: flex;
      align-items: center;
    }
  }

  .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    padding: 0 10px 0 0;
  }

  .state {
    display: flex;
    align-items: center;
  }

  .description {
    padding-left: 10px;
    padding-right: 10px;
    grid-area: description;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .action {
    grid-area: action;
    white-space: nowrap;

    button {
      height: 30px;
    }
  }

  .actions {
    grid-area: actions;
    display: flex;
    margin: 0 -#{$margin};
    margin-top: 16px;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    border-radius: 0 0 calc(1.5 * var(--border-radius)) calc(1.5 * var(--border-radius));
  }
}
</style>
