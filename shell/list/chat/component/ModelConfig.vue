<script>
import { Card } from '@components/Card';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import SliderInput from '@shell/components/SliderInput.vue';

export default {
  props: {
    config: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  components: {
    Card, SliderInput, LabeledInput
  },
  data() {
    return {
      dialogName: 'modelSetup',
      value:      this.config,
    };
  },

  methods: {
    show() {
      this.$modal.show(this.dialogName);
    },
    hide() {
      this.$modal.hide(this.dialogName);
    },

    send() {
      this.$emit('changeConfig', this.value);
      this.hide();
    }
  }
};
</script>

<template>
  <modal
    class="modal"
    :name="dialogName"
    title="参数设置"
    width="60%"
    height="auto"
    :click-to-close="false"
    @closed="hide"
  >
    <Card
      class="modal"
      :show-highlight-border="false"
    >
      <template #title>
        <h3
          slot="title"
          class="text-default-text"
        >
          参数设置
        </h3>
      </template>

      <template #body>
        <!-- <h4>模型</h4>
        <Select
          v-model="modalName"
          :searchable="true"
          :clearable="false"
          :options="modalOptions"
          class="mb-10"
        /> -->

        <h4>
          参数
        </h4>
        <div class="row mb-10">
          <div class="col span-12">
            <SliderInput
              v-model="value.temperature"
              :min="0"
              :max="2"
              :interval="0.1"
              label="Temperature"
              description="控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。"
            />
          </div>
        </div>
        <div class="row mb-10">
          <div class="col span-12">
            <SliderInput
              v-model="value.max_tokens"
              :min="0"
              :max="32768"
              :interval="1"
              label="Max Tokens"
              description="生成的最大 token 数。输入的 token 和生成的 token 的总长度受模型上下文长度的限制。"
            />
          </div>
        </div>

        <div class="row mb-10">
          <div class="col span-12">
            <SliderInput
              v-model="value.top_p"
              :min="0"
              :max="1"
              :interval="0.1"
              label="Top P"
              description="通过核心采样控制多样性：0.5 表示考虑所有基于概率权重选项的一半。"
            />
          </div>
        </div>

        <div class="row mb-10">
          <div class="col span-12">
            <LabeledInput
              v-model="value.seed"
              label="Seed"
              type="number"
              tooltip="如果指定，我们的系统将尽最大努力进行确定性采样，以便使用相同 seed 和参数的重复请求应返回相同的结果。"
            />
          </div>
        </div>

        <div class="row mb-10">
          <div class="col span-12">
            <LabeledInput
              v-model="value.stop"
              type="number"
              label="Stop Sequence"
              tooltip="停止序列是一个预定义或用户指定的文本字符串，当这些序列出现时，它会提示 AI 停止生成后续的 token。"
            />
          </div>
        </div>
      </template>

      <template #actions>
        <div class="footer">
          <button
            class="btn role-secondary"
            @click.prevent="send"
          >
            Ok
          </button>
        </div>
      </template>
    </Card>
  </modal>
</template>

<style lang="scss" scoped>
.modal .footer {
  width: 100%;
  display: flex;
  flex-direction: row-reverse;
}
</style>
