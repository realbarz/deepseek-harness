/** Model-facing consumer for the hardware telemetry service. */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { HardwareSnapshot } from '@deepseek-ai/dsh-hardware-monitor'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import type {} from '@deepseek-ai/dsh-system-prompt'

export const name = 'tool-hardware-monitor'
export const inject = ['tools', 'hardwareMonitor', 'systemPrompt']

const SNAPSHOT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    capturedAt: { type: 'integer', required: true },
    host: { type: 'object', required: true, additionalProperties: true },
    cpu: { type: 'array', required: true, items: { type: 'object', additionalProperties: true } },
    memory: { type: 'object', additionalProperties: true },
    gpu: { type: 'array', required: true, items: { type: 'object', additionalProperties: true } },
    disks: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
} as const

type ToolSnapshot = {
  capturedAt: number
  host: Record<string, JsonValue>
  cpu: Record<string, JsonValue>[]
  memory?: Record<string, JsonValue>
  gpu: Record<string, JsonValue>[]
  disks?: Record<string, JsonValue>[]
}

function toolSnapshot(snapshot: HardwareSnapshot): ToolSnapshot {
  return {
    capturedAt: snapshot.capturedAt,
    host: snapshot.host,
    cpu: snapshot.cpu.map(item => ({
      name: item.name,
      ...item.loadPercent !== undefined ? { loadPercent: item.loadPercent } : {},
      ...item.coreLoadPercents !== undefined ? { coreLoadPercents: [...item.coreLoadPercents] } : {},
      ...item.temperatureC !== undefined ? { temperatureC: item.temperatureC } : {},
      ...item.coreTemperaturesC !== undefined ? { coreTemperaturesC: [...item.coreTemperaturesC] } : {},
      ...item.packagePowerW !== undefined ? { packagePowerW: item.packagePowerW } : {},
      ...item.maxCoreMhz !== undefined ? { maxCoreMhz: item.maxCoreMhz } : {},
      ...item.bclkMhz !== undefined ? { bclkMhz: item.bclkMhz } : {},
      ...item.voltageV !== undefined ? { voltageV: item.voltageV } : {},
    })),
    ...snapshot.memory === undefined ? {} : {
      memory: {
        totalBytes: snapshot.memory.totalBytes,
        availableBytes: snapshot.memory.availableBytes,
        usedBytes: snapshot.memory.usedBytes,
        usedPercent: snapshot.memory.usedPercent,
        ...snapshot.memory.virtualTotalBytes !== undefined ? { virtualTotalBytes: snapshot.memory.virtualTotalBytes } : {},
        ...snapshot.memory.virtualAvailableBytes !== undefined ? { virtualAvailableBytes: snapshot.memory.virtualAvailableBytes } : {},
      },
    },
    gpu: snapshot.gpu.map(item => ({
      name: item.name,
      ...item.memoryBytes !== undefined ? { memoryBytes: item.memoryBytes } : {},
      ...item.loadPercent !== undefined ? { loadPercent: item.loadPercent } : {},
      ...item.temperatureC !== undefined ? { temperatureC: item.temperatureC } : {},
      ...item.hotSpotC !== undefined ? { hotSpotC: item.hotSpotC } : {},
      ...item.memoryTemperatureC !== undefined ? { memoryTemperatureC: item.memoryTemperatureC } : {},
      ...item.powerW !== undefined ? { powerW: item.powerW } : {},
      ...item.voltageV !== undefined ? { voltageV: item.voltageV } : {},
      ...item.coreMhz !== undefined ? { coreMhz: item.coreMhz } : {},
      ...item.memoryMhz !== undefined ? { memoryMhz: item.memoryMhz } : {},
      ...item.fansRpm !== undefined ? { fansRpm: [...item.fansRpm] } : {},
    })),
    ...snapshot.disks === undefined ? {} : {
      disks: snapshot.disks.map(item => ({
        name: item.name,
        ...item.temperatureC !== undefined ? { temperatureC: item.temperatureC } : {},
        ...item.activityPercent !== undefined ? { activityPercent: item.activityPercent } : {},
        ...item.readBytesPerSec !== undefined ? { readBytesPerSec: item.readBytesPerSec } : {},
        ...item.writeBytesPerSec !== undefined ? { writeBytesPerSec: item.writeBytesPerSec } : {},
      })),
    },
  }
}

function renderSnapshot(snapshot: ToolSnapshot): [{ type: 'text'; text: string }] {
  return [{ type: 'text', text: JSON.stringify(snapshot) }]
}

/** Registers the read-only `hardware_snapshot` tool. */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'hardware_snapshot',
    description: 'Read current host CPU load and temperatures, memory use, graphics adapter facts, and disk status from the composed hardware monitor. Missing sensors are omitted; values are a single point-in-time snapshot.',
    parameters: {},
    output: {
      schema: SNAPSHOT_SCHEMA,
      render: (_args, value) => renderSnapshot(value),
    },
    async execute(_args, exec) {
      return toolSnapshot(await ctx.hardwareMonitor.snapshot({ signal: exec.signal }))
    },
  }))
}
