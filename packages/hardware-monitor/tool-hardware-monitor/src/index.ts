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
  },
} as const

type ToolSnapshot = {
  capturedAt: number
  host: Record<string, JsonValue>
  cpu: Record<string, JsonValue>[]
  memory?: Record<string, JsonValue>
  gpu: Record<string, JsonValue>[]
}

function toolSnapshot(snapshot: HardwareSnapshot): ToolSnapshot {
  return {
    capturedAt: snapshot.capturedAt,
    host: { ...snapshot.host },
    cpu: snapshot.cpu.map(item => ({ ...item })),
    ...snapshot.memory === undefined ? {} : { memory: { ...snapshot.memory } },
    gpu: snapshot.gpu.map(item => ({ ...item })),
  }
}

function renderSnapshot(snapshot: ToolSnapshot): [{ type: 'text'; text: string }] {
  return [{ type: 'text', text: JSON.stringify(snapshot) }]
}

/** Registers the read-only `hardware_snapshot` tool. */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'hardware_snapshot',
    description: 'Read current host CPU load, memory use, and graphics adapter facts from the composed hardware monitor. Missing sensors are omitted; values are a single point-in-time snapshot.',
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
