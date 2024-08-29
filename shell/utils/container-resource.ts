export const GPU_KEY = 'nvidia.com/gpu';
export const DefaultGPURuntimeClass = 'nvidia';

export const FlatResources = {
  get(container: object): {
    limitsCpu?: string;
    limitsMemory?: string;
    requestsCpu?: string;
    requestsMemory?: string;
    limitsGpu?: string;
  } {
    const { limits = {}, requests = {} } = container.resources || {};
    const {
      cpu: limitsCpu,
      memory: limitsMemory,
      [GPU_KEY]: limitsGpu,
    } = limits;
    const { cpu: requestsCpu, memory: requestsMemory } = requests;

    return {
      limitsCpu,
      limitsMemory,
      requestsCpu,
      requestsMemory,
      limitsGpu,
    };
  },

  set(neu: {
    limitsCpu?: string;
    limitsMemory?: string;
    requestsCpu?: string;
    requestsMemory?: string;
    limitsGpu?: string;
  }): object {
    const {
      limitsCpu,
      limitsMemory,
      requestsCpu,
      requestsMemory,
      limitsGpu,
    } = neu;

    const out = {
      requests: {
        cpu:    requestsCpu,
        memory: requestsMemory,
      },
      limits: {
        cpu:       limitsCpu,
        memory:    limitsMemory,
        [GPU_KEY]: limitsGpu,
      },
    };

    return out;
  },

  validateGPU(podSpec: object): object {
    const container = podSpec.containers[0];
    const containerResources = container.resources;
    const nvidiaGpuLimit = container.resources.limits?.[GPU_KEY];

    if (nvidiaGpuLimit > 0) {
      containerResources.requests = containerResources.requests || {};
      containerResources.requests[GPU_KEY] = nvidiaGpuLimit;

      if (!podSpec.runtimeClassName || podSpec.runtimeClassName === '') {
        podSpec.runtimeClassName = DefaultGPURuntimeClass;
      }
    } else {
      delete podSpec.runtimeClassName;
    }

    if (!nvidiaIsValid(nvidiaGpuLimit)) {
      try {
        delete containerResources.requests[GPU_KEY];
        delete containerResources.limits[GPU_KEY];

        if (Object.keys(containerResources.limits).length === 0) {
          delete containerResources.limits;
        }
        if (Object.keys(containerResources.requests).length === 0) {
          delete containerResources.requests;
        }
        if (Object.keys(containerResources).length === 0) {
          delete container.resources;
        }
      } catch {}
    }

    return podSpec;
  }
};

function nvidiaIsValid(nvidiaGpuLimit): boolean {
  if ( !Number.isInteger(parseInt(nvidiaGpuLimit)) ) {
    return false;
  }
  if (nvidiaGpuLimit === undefined) {
    return false;
  }
  if (nvidiaGpuLimit < 1) {
    return false;
  } else {
    return true;
  }
}
