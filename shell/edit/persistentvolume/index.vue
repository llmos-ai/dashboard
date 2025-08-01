<script>
import { mapGetters } from 'vuex';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ArrayList from '@shell/components/form/ArrayList';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import NodeAffinity from '@shell/components/form/NodeAffinity';
import { Checkbox } from '@shell/components/form/Checkbox';
import uniq from 'lodash/uniq';
import UnitInput from '@shell/components/form/UnitInput';
import { VOLUME_PLUGINS, LONGHORN_PLUGIN } from '@shell/config/persistentVolume';
import { NODE, PVC, STORAGE_CLASS } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';
import InfoBox from '@shell/components/InfoBox';
import ResourceManager from '@shell/mixins/resource-manager';

export default {
  name: 'PersistentVolume',

  components: {
    ArrayList,
    ArrayListGrouped,
    Checkbox,
    CruResource,
    InfoBox,
    LabeledSelect,
    Loading,
    MatchExpressions,
    NameNsDescription,
    NodeAffinity,
    Tab,
    Tabbed,
    UnitInput
  },

  mixins: [CreateEditView, ResourceManager],

  fetch() {
    if (this.mode !== _CREATE) {
      this.secondaryResourceData.namespace = this.value?.spec?.claimRef?.namespace || null;

      this.secondaryResourceData.data[PVC] = {
        applyTo: [
          {
            var:         'currentClaim',
            classify:    true,
            parsingFunc: (data) => {
              return data.find((claim) => claim.spec.volumeName === this.value.name);
            }
          }
        ]
      };
    }

    this.resourceManagerFetchSecondaryResources(this.secondaryResourceData);
  },

  data() {
    const NONE_OPTION = {
      label: this.t('generic.none'),
      value: ''
    };
    const defaultAccessModes = ['ReadWriteOnce'];

    this.value['spec'] = this.value.spec || {};
    this.value.spec['accessModes'] = this.value.spec.accessModes || defaultAccessModes;
    this.value.spec['capacity'] = this.value.spec.capacity || {};
    this.value.spec.capacity['storage'] = this.value.spec.capacity.storage || '10Gi';
    this.value.spec['storageClassName'] = this.value.spec.storageClassName || NONE_OPTION.value;

    const foundPlugin = this.value.isLonghorn ? LONGHORN_PLUGIN : VOLUME_PLUGINS.find((plugin) => this.value.spec[plugin.value]);
    const plugin = (foundPlugin || VOLUME_PLUGINS[0]).value;

    return {
      secondaryResourceData: this.secondaryResourceDataConfig(),
      storageClassOptions:   [],
      currentClaim:          null,
      plugin,
      NONE_OPTION,
      NODE,
      initialNodeAffinity:   clone(this.value.spec.nodeAffinity),
    };
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster']),

    readWriteOnce: {
      get() {
        return this.value.spec.accessModes.includes('ReadWriteOnce');
      },
      set(value) {
        this.checkboxSetter('ReadWriteOnce', value);
      }
    },
    readOnlyMany: {
      get() {
        return this.value.spec.accessModes.includes('ReadOnlyMany');
      },
      set(value) {
        this.checkboxSetter('ReadOnlyMany', value);
      }
    },
    readWriteMany: {
      get() {
        return this.value.spec.accessModes.includes('ReadWriteMany');
      },
      set(value) {
        this.checkboxSetter('ReadWriteMany', value);
      }
    },
    modeOverride() {
      return this.isCreate ? _CREATE : _VIEW;
    },
    nodeSelectorTerms: {
      get() {
        return this.value.spec.nodeAffinity?.required?.nodeSelectorTerms || [];
      },
      set(value) {
        if (value.length > 0) {
          const defaultValue = { required: { nodeSelectorTerms: [] } };

          if (!this.value.spec.nodeAffinity?.required?.nodeSelectorTerms) {
            this.value.spec['nodeAffinity'] = this.value.spec.nodeAffinity || defaultValue;
            this.value.spec.nodeAffinity['required'] = this.value.spec.nodeAffinity.required || defaultValue.required;
            this.value.spec.nodeAffinity.required['nodeSelectorTerms'] = this.value.spec.nodeAffinity.required.nodeSelectorTerms || defaultValue.required.nodeSelectorTerms;
          }

          this.value.spec.nodeAffinity.required['nodeSelectorTerms'] = value;
        } else {
          this.value.spec.nodeAffinity['nodeAffinity'] = undefined;
        }
      }
    },
    areNodeSelectorsRequired() {
      return this.plugin === 'local';
    },
    plugins() {
      return VOLUME_PLUGINS.filter((plugin) => plugin.supported);
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    secondaryResourceDataConfig() {
      return {
        namespace: null,
        data:      {
          [STORAGE_CLASS]: {
            applyTo: [
              {
                var:         'storageClassOptions',
                parsingFunc: (data) => {
                  const storageClassOptions = data.map((s) => ({
                    label: s.metadata.name,
                    value: s.metadata.name
                  }));

                  storageClassOptions.unshift(this.NONE_OPTION);

                  return storageClassOptions;
                }
              }
            ]
          },
        }
      };
    },
    checkboxSetter(key, value) {
      if (value) {
        this.value.spec.accessModes.push(key);
        this.value['accessModes'] = uniq(this.value.spec.accessModes);
      } else {
        const indexOf = this.value.spec.accessModes.indexOf(key);

        if (indexOf >= 0) {
          this.value.spec.accessModes.splice(indexOf, 1);
        }
      }
    },
    getComponent(name) {
      return require(`./plugins/${ name }`).default;
    },
    willSave() {
      if (this.value.spec.storageClassName === this.NONE_OPTION.value) {
        this.value.spec['storageClassName'] = null;
      }

      if (!this.isCreate) {
        this.value.spec['nodeAffinity'] = this.initialNodeAffinity;
      }
    },
    updatePlugin(value) {
      const plugin = this.plugin === LONGHORN_PLUGIN.value ? 'csi' : this.plugin;

      delete this.value.spec[plugin];
      this['plugin'] = value;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :bannerErrors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
      :namespaced="false"
    />

    <InfoBox v-if="currentClaim">
      <div class="row">
        <div class="col span-6 text-center">
          <label class="text-muted">Persistent Volume Claim:</label>&nbsp;
          <router-link :to="currentClaim.detailLocation">
            {{ currentClaim.namespacedName }}
          </router-link>
        </div>
        <div class="col span-6 text-center">
          <label class="text-muted">Age:</label>&nbsp;
          <LiveDate
            class="live-date"
            :value="value.metadata.creationTimestamp"
          />
        </div>
      </div>
    </InfoBox>

    <div class="row mb-20 top-level">
      <div class="col span-6">
        <LabeledSelect
          :value="plugin"
          :label="t('persistentVolume.plugin.label')"
          :localized-label="true"
          option-label="labelKey"
          data-testid="persistent-volume-plugin-select"
          :options="plugins"
          :mode="modeOverride"
          :required="true"
          @update:value="updatePlugin($event)"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model:value="value.spec.capacity.storage"
          :required="true"
          :label="t('persistentVolume.capacity.label')"
          :increment="1024"
          :input-exponent="3"
          :output-modifier="true"
          :mode="mode"
        />
      </div>
    </div>
    <Tabbed :side-tabs="true">
      <Tab
        name="plugin-configuration"
        :label="t('persistentVolume.pluginConfiguration.label')"
        :weight="1"
      >
        <component
          :is="getComponent(plugin)"
          :key="plugin"
          :value="value"
          :mode="modeOverride"
        />
      </Tab>
      <Tab
        name="customize"
        :label="t('persistentVolume.customize.label')"
        :weight="0"
      >
        <div class="row mb-20">
          <div class="col span-6">
            <h3>{{ t('persistentVolume.customize.accessModes.label') }}</h3>
            <div>
              <Checkbox
                v-model:value="readWriteOnce"
                :label="t('persistentVolume.customize.accessModes.readWriteOnce')"
                :mode="mode"
              />
            </div>
            <div>
              <Checkbox
                v-model:value="readOnlyMany"
                :label="t('persistentVolume.customize.accessModes.readOnlyMany')"
                :mode="mode"
              />
            </div>
            <div>
              <Checkbox
                v-model:value="readWriteMany"
                :label="t('persistentVolume.customize.accessModes.readWriteMany')"
                :mode="mode"
              />
            </div>
          </div>
          <div class="col span-6">
            <ArrayList
              v-model:value="value.spec.mountOptions"
              :mode="mode"
              :title="t('persistentVolume.customize.mountOptions.label')"
              :add-label="t('persistentVolume.customize.mountOptions.addLabel')"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.spec.storageClassName"
              :label="t('persistentVolume.customize.assignToStorageClass.label')"
              :options="storageClassOptions"
              :loading="isLoadingSecondaryResources"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <h3>
              {{ t('persistentVolume.customize.affinity.label') }} <span
                v-if="areNodeSelectorsRequired"
                class="required text-small"
              >*</span>
            </h3>
            <ArrayListGrouped
              v-model:value="nodeSelectorTerms"
              :mode="modeOverride"
              :default-add-value="{matchExpressions:[]}"
              :add-label="t('workload.scheduling.affinity.addNodeSelector')"
            >
              <template #default="props">
                <MatchExpressions
                  v-model:value="props.row.value.matchExpressions"
                  :mode="modeOverride"
                  class="col span-12"
                  :type="NODE"
                  :show-remove="false"
                />
              </template>
            </ArrayListGrouped>
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
<style lang="scss" scoped>
.top-level .col > .labeled-select:not(.taggable) {
  max-height: 100%;
  height: 100%;
}
.info-box {
  flex-grow: 0;
}
</style>
