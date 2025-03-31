export const PullPolicyOptions = ['Always', 'IfNotPresent', 'Never'];
export const SvcOptions = ['ClusterIP', 'NodePort', 'LoadBalancer'];

// AI model config
export const ModelParamConfig = {
  model:          '',
  // model: "deepseek-reasoner",
  stream:         true,
  stream_options: { include_usage: true },
  temperature:    1,
  top_p:          1,
  seed:           null,
  stop:           null,
  max_tokens:     4090,
};

export const CHAT_TYPE = ['chat', 'compare'];
