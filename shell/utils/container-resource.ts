export const DefaultGPURuntimeClass = 'nvidia';
export const VolcanoScheduler = 'volcano';

export const NVIDIA = {
  Name:           'nvidia',
  GPU:            'nvidia.com/gpu', // 1, each GPU is allocated 1 GPU.
  vGPU:           'volcano.sh/vgpu-number', // 1, each GPU is allocated 1 vGPU.
  vGPUMem:        'volcano.sh/vgpu-memory', // 1024, each GPU allocates 1024MB of memory.
  vGPUMemPercent: 'volcano.sh/vgpu-memory-percentage', // 50, each GPU allocates 50% of its memory.
  vGPUCores:      'volcano.sh/vgpu-cores', // 50, each GPU allocates 50% device cores.
  AnnoDeviceType: 'nvidia.com/use-gputype', // "A100, V100", each GPU allocates the specified type.
  AnnoDeviceUUID: 'nvidia.com/use-gpuuid',
};
export const Accelerators = [
  {
    label: 'Nvidia',
    value: NVIDIA.Name,
    key:   NVIDIA.vGPU,
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
      [NVIDIA.vGPU]: limitsGpu,
    } = limits;
    const { cpu: requestsCpu, memory: requestsMemory } = requests;

    let limitsVGpuMem, limitsVGpuCores;
    const gpuType = getGpuType(container.resources);

    if (gpuType) {
      switch (gpuType) {
      case NVIDIA.Name:
        limitsVGpuMem = limits[NVIDIA.vGPUMem];
        limitsVGpuCores = limits[NVIDIA.vGPUCores];
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
        cpu:    limitsCpu,
        memory: limitsMemory,
        ...(gpuType === NVIDIA.Name ? {
          [NVIDIA.vGPU]:      limitsGpu,
          [NVIDIA.vGPUMem]:   limitsVGpuMem,
          [NVIDIA.vGPUCores]: limitsVGpuCores,
        } : {})
      },
      gpuType,
    };

    return out;
  },

  validateGPU(podSpec: object): object {
    const container = podSpec.containers[0];
    const containerResources = container.resources;
    const nvidiaGpuLimit = container.resources.limits?.[NVIDIA.vGPU];

    if (nvidiaGpuLimit > 0) {
      if (!podSpec.runtimeClassName || podSpec.runtimeClassName === '') {
        podSpec.runtimeClassName = DefaultGPURuntimeClass;
      }
    } else {
      delete podSpec.runtimeClassName;
      delete podSpec.schedulerName;
    }

    if (!nvidiaIsValid(nvidiaGpuLimit)) {
      try {
        delete containerResources.limits[NVIDIA.vGPU];

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
  if (resources.limits && resources.limits[NVIDIA.vGPU]) {
    return NVIDIA.Name;
  }
}

export function hasGPUResources(containers: object): boolean {
  for (const container of containers) {
    if (container.resources?.limits?.[NVIDIA.vGPU] || container?.resources?.limits?.[NVIDIA.GPU]) {
      return true;
    }
  }

  return false;
}
