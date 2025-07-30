export const VLLM_CONFIG = [
  {
    label:   '--task',
    value:   '--task',
    options: ['auto', 'generate', 'embedding', 'embed', 'classify', 'score', 'reward', 'transcription']
  },
  {
    label:   '--tool-call-parser',
    value:   '--tool-call-parser',
    options: ['deepseek_v3', 'glm4_moe', 'granite-20b-fc', 'granite', 'hermes', 'hunyuan_a13b', 'internlm', 'jamba', 'kimi_k2', 'llama4_pythonic', 'llama4_json', 'llama3_json', 'minimax', 'mistral', 'phi4_mini_json', 'pythonic', 'qwen3_coder', 'xlam']
  },
  {
    label:   '--tokenizer',
    value:   '--tokenizer',
    options: []
  },
  {
    label:   '--hf-config-path',
    value:   '--hf-config-path',
    options: []
  },
  {
    label:   '--skip-tokenizer-init',
    value:   '--skip-tokenizer-init',
    options: []
  },
  {
    label:   '--revision',
    value:   '--revision',
    options: []
  },
  {
    label:   '--code-revision',
    value:   '--code-revision',
    options: []
  },
  {
    label:   '--tokenizer-revision',
    value:   '--tokenizer-revision',
    options: []
  },
  {
    label:   '--tokenizer-mode',
    value:   '--tokenizer-mode',
    options: ['auto', 'slow', 'mistral', 'custom']
  },
  {
    label:   '--trust-remote-code',
    value:   '--trust-remote-code',
    options: []
  },
  {
    label:   '--allowed-local-media-path',
    value:   '--allowed-local-media-path',
    options: []
  },
  {
    label:   '--load-format',
    value:   '--load-format',
    options: ['auto', 'pt', 'safetensors', 'npcache', 'dummy', 'tensorizer', 'sharded_state', 'gguf', 'bitsandbytes', 'mistral', 'runai_streamer', 'fastsafetensors']
  },
  {
    label:   '--download-dir',
    value:   '--download-dir',
    options: []
  },
  {
    label:   '--model-loader-extra-config',
    value:   '--model-loader-extra-config',
    options: []
  },
  {
    label:   '--use-tqdm-on-load',
    value:   '--use-tqdm-on-load',
    options: []
  },
  {
    label:   '--no-use-tqdm-on-load',
    value:   '--no-use-tqdm-on-load',
    options: []
  },
  {
    label:   '--config-format',
    value:   '--config-format',
    options: ['auto', 'hf', 'mistral']
  },
  {
    label:   '--dtype',
    value:   '--dtype',
    options: ['auto', 'half', 'float16', 'bfloat16', 'float', 'float32']
  },
  {
    label:   '--kv-cache-dtype',
    value:   '--kv-cache-dtype',
    options: ['auto', 'fp8', 'fp8_e5m2', 'fp8_e4m3']
  },
  {
    label:   '--max-model-len',
    value:   '--max-model-len',
    options: []
  },
  {
    label:   '--guided-decoding-backend',
    value:   '--guided-decoding-backend',
    options: []
  },
  {
    label:   '--logits-processor-pattern',
    value:   '--logits-processor-pattern',
    options: []
  },
  {
    label:   '--model-impl',
    value:   '--model-impl',
    options: ['auto', 'vllm', 'transformers']
  },
  {
    label:   '--distributed-executor-backend',
    value:   '--distributed-executor-backend',
    options: ['ray', 'mp', 'uni', 'external_launcher']
  },
  {
    label:   '--pipeline-parallel-size',
    value:   '--pipeline-parallel-size',
    options: []
  },
  {
    label:   '--tensor-parallel-size',
    value:   '--tensor-parallel-size',
    options: []
  },
  {
    label:   '--data-parallel-size',
    value:   '--data-parallel-size',
    options: []
  },
  {
    label:   '--enable-auto-tool-choice',
    value:   '--enable-auto-tool-choice',
    options: []
  },
  {
    label:   '--enable-expert-parallel',
    value:   '--enable-expert-parallel',
    options: []
  },
  {
    label:   '--no-enable-expert-parallel',
    value:   '--no-enable-expert-parallel',
    options: []
  },
  {
    label:   '--max-parallel-loading-workers',
    value:   '--max-parallel-loading-workers',
    options: []
  },
  {
    label:   '--ray-workers-use-nsight',
    value:   '--ray-workers-use-nsight',
    options: []
  },
  {
    label:   '--no-ray-workers-use-nsight',
    value:   '--no-ray-workers-use-nsight',
    options: []
  },
  {
    label:   '--disable-custom-all-reduce',
    value:   '--disable-custom-all-reduce',
    options: []
  },
  {
    label:   '--no-disable-custom-all-reduce',
    value:   '--no-disable-custom-all-reduce',
    options: []
  },
  {
    label:   '--block-size',
    value:   '--block-size',
    options: ['8', '16', '32', '64', '128']
  },
  {
    label:   '--enable-prefix-caching',
    value:   '--enable-prefix-caching',
    options: []
  },
  {
    label:   '--no-enable-prefix-caching',
    value:   '--no-enable-prefix-caching',
    options: []
  },
  {
    label:   '--prefix-caching-hash-algo',
    value:   '--prefix-caching-hash-algo',
    options: ['builtin', 'sha256']
  },
  {
    label:   '--disable-sliding-window',
    value:   '--disable-sliding-window',
    options: []
  },
  {
    label:   '--use-v2-block-manager',
    value:   '--use-v2-block-manager',
    options: []
  },
  {
    label:   '--seed',
    value:   '--seed',
    options: []
  },
  {
    label:   '--swap-space',
    value:   '--swap-space',
    options: []
  },
  {
    label:   '--cpu-offload-gb',
    value:   '--cpu-offload-gb',
    options: []
  },
  {
    label:   '--gpu-memory-utilization',
    value:   '--gpu-memory-utilization',
    options: []
  },
  {
    label:   '--num-gpu-blocks-override',
    value:   '--num-gpu-blocks-override',
    options: []
  },
  {
    label:   '--max-logprobs',
    value:   '--max-logprobs',
    options: []
  },
  {
    label:   '--disable-log-stats',
    value:   '--disable-log-stats',
    options: []
  },
  {
    label:   '--quantization',
    value:   '--quantization',
    options: ['aqlm', 'awq', 'deepspeedfp', 'tpu_int8', 'fp8', 'ptpc_fp8', 'fbgemm_fp8', 'modelopt', 'nvfp4', 'marlin', 'gguf', 'gptq_marlin_24', 'gptq_marlin', 'awq_marlin', 'gptq', 'compressed-tensors', 'bitsandbytes', 'qqq', 'hqq', 'experts_int8', 'neuron_quant', 'ipex', 'quark', 'moe_wna16', 'torchao', 'None']
  },
  {
    label:   '--rope-scaling',
    value:   '--rope-scaling',
    options: []
  },
  {
    label:   '--rope-theta',
    value:   '--rope-theta',
    options: []
  },
  {
    label:   '--hf-token',
    value:   '--hf-token',
    options: []
  },
  {
    label:   '--hf-overrides',
    value:   '--hf-overrides',
    options: []
  },
  {
    label:   '--enforce-eager',
    value:   '--enforce-eager',
    options: []
  },
  {
    label:   '--max-seq-len-to-capture',
    value:   '--max-seq-len-to-capture',
    options: []
  },
  {
    label:   '--tokenizer-pool-size',
    value:   '--tokenizer-pool-size',
    options: []
  },
  {
    label:   '--tokenizer-pool-type',
    value:   '--tokenizer-pool-type',
    options: []
  },
  {
    label:   '--tokenizer-pool-extra-config',
    value:   '--tokenizer-pool-extra-config',
    options: []
  },
  {
    label:   '--limit-mm-per-prompt',
    value:   '--limit-mm-per-prompt',
    options: []
  },
  {
    label:   '--mm-processor-kwargs',
    value:   '--mm-processor-kwargs',
    options: []
  },
  {
    label:   '--disable-mm-preprocessor-cache',
    value:   '--disable-mm-preprocessor-cache',
    options: []
  },
  {
    label:   '--enable-lora',
    value:   '--enable-lora',
    options: []
  },
  {
    label:   '--enable-lora-bias',
    value:   '--enable-lora-bias',
    options: []
  },
  {
    label:   '--max-loras',
    value:   '--max-loras',
    options: []
  },
  {
    label:   '--max-lora-rank',
    value:   '--max-lora-rank',
    options: []
  },
  {
    label:   '--lora-extra-vocab-size',
    value:   '--lora-extra-vocab-size',
    options: []
  },
  {
    label:   '--lora-dtype',
    value:   '--lora-dtype',
    options: ['auto', 'float16', 'bfloat16']
  },
  {
    label:   '--long-lora-scaling-factors',
    value:   '--long-lora-scaling-factors',
    options: []
  },
  {
    label:   '--max-cpu-loras',
    value:   '--max-cpu-loras',
    options: []
  },
  {
    label:   '--fully-sharded-loras',
    value:   '--fully-sharded-loras',
    options: []
  },
  {
    label:   '--enable-prompt-adapter',
    value:   '--enable-prompt-adapter',
    options: []
  },
  {
    label:   '--max-prompt-adapters',
    value:   '--max-prompt-adapters',
    options: []
  },
  {
    label:   '--max-prompt-adapter-token',
    value:   '--max-prompt-adapter-token',
    options: []
  },
  {
    label:   '--device',
    value:   '--device',
    options: ['auto', 'cuda', 'neuron', 'cpu', 'tpu', 'xpu', 'hpu']
  },
  {
    label:   '--num-scheduler-steps',
    value:   '--num-scheduler-steps',
    options: []
  },
  {
    label:   '--speculative-config',
    value:   '--speculative-config',
    options: []
  },
  {
    label:   '--ignore-patterns',
    value:   '--ignore-patterns',
    options: []
  },
  {
    label:   '--preemption-mode',
    value:   '--preemption-mode',
    options: []
  },
  {
    label:   '--served-model-name',
    value:   '--served-model-name',
    options: []
  },
  {
    label:   '--qlora-adapter-name-or-path',
    value:   '--qlora-adapter-name-or-path',
    options: []
  },
  {
    label:   '--show-hidden-metrics-for-version',
    value:   '--show-hidden-metrics-for-version',
    options: []
  },
  {
    label:   '--otlp-traces-endpoint',
    value:   '--otlp-traces-endpoint',
    options: []
  },
  {
    label:   '--collect-detailed-traces',
    value:   '--collect-detailed-traces',
    options: []
  },
  {
    label:   '--disable-async-output-proc',
    value:   '--disable-async-output-proc',
    options: []
  },
  {
    label:   '--max-num-batched-tokens',
    value:   '--max-num-batched-tokens',
    options: []
  },
  {
    label:   '--max-num-seqs',
    value:   '--max-num-seqs',
    options: []
  },
  {
    label:   '--max-num-partial-prefills',
    value:   '--max-num-partial-prefills',
    options: []
  },
  {
    label:   '--max-long-partial-prefills',
    value:   '--max-long-partial-prefills',
    options: []
  },
  {
    label:   '--long-prefill-token-threshold',
    value:   '--long-prefill-token-threshold',
    options: []
  },
  {
    label:   '--num-lookahead-slots',
    value:   '--num-lookahead-slots',
    options: []
  },
  {
    label:   '--scheduler-delay-factor',
    value:   '--scheduler-delay-factor',
    options: []
  },
  {
    label:   '--enable-chunked-prefill',
    value:   '--enable-chunked-prefill',
    options: []
  },
  {
    label:   '--no-enable-chunked-prefill',
    value:   '--no-enable-chunked-prefill',
    options: []
  },
  {
    label:   '--multi-step-stream-outputs',
    value:   '--multi-step-stream-outputs',
    options: []
  },
  {
    label:   '--no-multi-step-stream-outputs',
    value:   '--no-multi-step-stream-outputs',
    options: []
  },
  {
    label:   '--scheduling-policy',
    value:   '--scheduling-policy',
    options: ['fcfs', 'priority']
  },
  {
    label:   '--disable-chunked-mm-input',
    value:   '--disable-chunked-mm-input',
    options: []
  },
  {
    label:   '--no-disable-chunked-mm-input',
    value:   '--no-disable-chunked-mm-input',
    options: []
  },
  {
    label:   '--scheduler-cls',
    value:   '--scheduler-cls',
    options: []
  },
  {
    label:   '--override-neuron-config',
    value:   '--override-neuron-config',
    options: []
  },
  {
    label:   '--override-pooler-config',
    value:   '--override-pooler-config',
    options: []
  },
  {
    label:   '--compilation-config',
    value:   '--compilation-config',
    options: []
  },
  {
    label:   '--kv-transfer-config',
    value:   '--kv-transfer-config',
    options: []
  },
  {
    label:   '--worker-cls',
    value:   '--worker-cls',
    options: []
  },
  {
    label:   '--worker-extension-cls',
    value:   '--worker-extension-cls',
    options: []
  },
  {
    label:   '--generation-config',
    value:   '--generation-config',
    options: []
  },
  {
    label:   '--override-generation-config',
    value:   '--override-generation-config',
    options: []
  },
  {
    label:   '--enable-sleep-mode',
    value:   '--enable-sleep-mode',
    options: []
  },
  {
    label:   '--calculate-kv-scales',
    value:   '--calculate-kv-scales',
    options: []
  },
  {
    label:   '--additional-config',
    value:   '--additional-config',
    options: []
  },
  {
    label:   '--enable-reasoning',
    value:   '--enable-reasoning',
    options: []
  },
  {
    label:   '--reasoning-parser',
    value:   '--reasoning-parser',
    options: ['deepseek_r1', 'granite', 'glm4_moe', 'hunyuan_a13b', 'mistral', 'qwen3']
  },
  {
    label:   '--disable-cascade-attn',
    value:   '--disable-cascade-attn',
    options: []
  }
];
