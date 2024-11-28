export const GPU_KEY = 'nvidia.com/gpu';
export const DefaultGPURuntimeClass = 'nvidia';

export const NVIDIA = {
  Name:           'nvidia',
  GPU:            'nvidia.com/gpu', // 1, each GPU is allocated 1 GPU.
  GPUMem:         'nvidia.com/gpumem', // 1024, each GPU allocates 1024MB of memory.
  GPUMemPercent:  'nvidia.com/gpumem-percentage', // 50, each GPU allocates 50% of its memory.
  GPUCores:       'nvidia.com/gpucores', // 50, each GPU allocates 50% device cores.
  AnnoDeviceType: 'nvidia.com/use-gputype', // "A100, V100", each GPU allocates the specified type.
  AnnoDeviceUUID: 'nvidia.com/use-gpuuid',
};
export const Accelerators = [
  {
    label: 'Nvidia',
    value: NVIDIA.Name,
    key:   NVIDIA.GPU,
  }];

export const ASCEND = {
  GPU_910A: {
    GPU:    'huawei.com/Ascend910A',
    GPUMem: 'huawei.com/Ascend910A-memory',
  },
  GPU_910B: {
    GPU:    'huawei.com/Ascend910B',
    GPUMem: 'huawei.com/Ascend910B-memory',
  },
  GPU_310P: {
    GPU:    'huawei.com/Ascend310P',
    GPUMem: 'huawei.com/Ascend310P-memory',
  },
};

export const FlatResources = {
  get(container: object): {
    limitsCpu?: string;
    limitsMemory?: string;
    requestsCpu?: string;
    requestsMemory?: string;
    limitsGpu?: string;
    gpuType?: string;
    limitsVGpuMem?: string;
    limitsVGpuCores?: string;
  } {
    const { limits = {}, requests = {} } = container.resources || {};
    const {
      cpu: limitsCpu,
      memory: limitsMemory,
      [GPU_KEY]: limitsGpu,
    } = limits;
    const { cpu: requestsCpu, memory: requestsMemory } = requests;

    let limitsVGpuMem, limitsVGpuCores;
    const gpuType = getGpuType(container.resources);

    if (gpuType) {
      switch (gpuType) {
      case NVIDIA.Name:
        limitsVGpuMem = limits[NVIDIA.GPUMem];
        limitsVGpuCores = limits[NVIDIA.GPUCores];
        break;
      default:
        console.error('FlatResources: unknown gpuType', gpuType); // eslint-disable-line no-console
      }
    }

    return {
      limitsCpu,
      limitsMemory,
      requestsCpu,
      requestsMemory,
      limitsGpu,
      gpuType,
      limitsVGpuMem,
      limitsVGpuCores,
    };
  },

  set(neu: {
    limitsCpu?: string;
    limitsMemory?: string;
    requestsCpu?: string;
    requestsMemory?: string;
    limitsGpu?: string;
    gpuType?: string;
    limitsVGpuMem?: string;
    limitsVGpuCores?: string;
  }): object {
    const {
      limitsCpu,
      limitsMemory,
      requestsCpu,
      requestsMemory,
      limitsGpu,
      gpuType,
      limitsVGpuMem,
      limitsVGpuCores,
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
        ...(gpuType === NVIDIA.Name ? {
          [NVIDIA.GPUMem]:   limitsVGpuMem,
          [NVIDIA.GPUCores]: limitsVGpuCores,
        } : {})
      },
      gpuType,
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

function getGpuType(resources: object): string {
  if (resources.gpuType) {
    return resources.gpuType;
  }
  if (resources.limits && resources.limits[NVIDIA.GPU]) {
    return NVIDIA.Name;
  }
}

export function hasGPUResources(resources: object): boolean {
  return !!resources?.limits?.[NVIDIA.GPU];
}
