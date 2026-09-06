/** Windows CIM provider for the hardware telemetry service. */
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { HardwareMonitor } from '@deepseek-ai/dsh-hardware-monitor'
import type {
  HardwareMonitorSettings,
  HardwareSensorCategory,
  HardwareSnapshot,
  HardwareSnapshotListener,
  HardwareSnapshotRequest,
} from '@deepseek-ai/dsh-hardware-monitor'
import type { SubprocessOutputReader } from '@deepseek-ai/dsh-subprocess'
import { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-settings'

/** Provider configuration. */
export interface Config {
  /** Maximum time allowed for one CIM query. */
  timeoutMs?: number
  /** Maximum retained stdout bytes. */
  maxOutputBytes?: number
}

export const HARDWARE_MONITOR_SETTINGS_NAMESPACE = 'hardware-monitor'

const DEFAULT_INTERVAL_MS = 2_000
const DEFAULT_CATEGORIES: readonly HardwareSensorCategory[] = ['cpu', 'memory']
const MAX_SENSOR_NAMES = 32
const MAX_SENSOR_NAME_LENGTH = 160

export const HardwareMonitorSettingsSchema: z<HardwareMonitorSettings> = z.object({
  enabled: z.boolean().default(true),
  intervalMs: z.number().step(1).min(250).max(60_000).default(DEFAULT_INTERVAL_MS),
  categories: z.array(z.union(['cpu', 'memory', 'gpu'] as const)).default([...DEFAULT_CATEGORIES]),
  sensorNames: z.array(z.string()).default([]),
})

export type ResolvedHardwareMonitorSettings = Required<HardwareMonitorSettings>

export function validateSettings(settings: HardwareMonitorSettings): void {
  const resolved = settings as ResolvedHardwareMonitorSettings
  if (!Number.isSafeInteger(resolved.intervalMs) || resolved.intervalMs < 250 || resolved.intervalMs > 60_000) {
    throw new Error('hardware-monitor-windows: intervalMs must be an integer from 250 to 60000')
  }
  if (resolved.categories.length === 0) throw new Error('hardware-monitor-windows: at least one category is required')
  if (resolved.sensorNames.length > MAX_SENSOR_NAMES) {
    throw new Error(`hardware-monitor-windows: at most ${MAX_SENSOR_NAMES} sensor names are allowed`)
  }
  for (const sensorName of resolved.sensorNames) {
    if (sensorName.trim().length === 0 || sensorName.length > MAX_SENSOR_NAME_LENGTH) {
      throw new Error(`hardware-monitor-windows: sensor names must be 1-${MAX_SENSOR_NAME_LENGTH} characters`)
    }
  }
}

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export function queryFor(settings: ResolvedHardwareMonitorSettings): string {
  const categories = new Set(settings.categories)
  const sensorFilter = settings.sensorNames.length === 0
    ? ''
    : ` | Where-Object { @(${settings.sensorNames.map(quotePowerShell).join(',')}) -contains $_.Name }`
  const cpu = categories.has('cpu')
    ? `$cpu = @(Get-CimInstance Win32_Processor${sensorFilter} | Select-Object Name, LoadPercentage)`
    : '$cpu = @()'
  const os = categories.has('memory')
    ? '$os = Get-CimInstance Win32_OperatingSystem'
    : '$os = $null'
  const gpu = categories.has('gpu')
    ? `$gpu = @(Get-CimInstance Win32_VideoController${sensorFilter} | Select-Object Name, AdapterRAM)`
    : '$gpu = @()'
  return `
${cpu}
${os}
${gpu}
[pscustomobject]@{
  computerName = $env:COMPUTERNAME
  osVersion = if ($os) { [string]$os.Version } else { $null }
  cpu = $cpu
  memory = if ($os) { [pscustomobject]@{
    totalBytes = [double]$os.TotalVisibleMemorySize * 1024
    availableBytes = [double]$os.FreePhysicalMemory * 1024
  } } else { $null }
  gpu = $gpu
} | ConvertTo-Json -Compress -Depth 4
`
}

interface RawSnapshot {
  computerName?: string
  osVersion?: string
  cpu?: readonly { Name?: string; LoadPercentage?: number }[]
  memory?: { totalBytes?: number; availableBytes?: number } | null
  gpu?: readonly { Name?: string; AdapterRAM?: number }[]
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function arrayOf<T>(value: T | readonly T[] | undefined): readonly T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value as T]
}

export function parseSnapshot(text: string): HardwareSnapshot {
  const raw = JSON.parse(text) as RawSnapshot
  const totalBytes = numberOrUndefined(raw.memory?.totalBytes)
  const availableBytes = numberOrUndefined(raw.memory?.availableBytes)
  if (raw.memory !== null && raw.memory !== undefined
    && (totalBytes === undefined || availableBytes === undefined || totalBytes < 0 || availableBytes < 0 || availableBytes > totalBytes)) {
    throw new Error('hardware-monitor-windows: CIM returned invalid memory totals')
  }
  const memory = raw.memory === null || raw.memory === undefined
    ? undefined
    : {
      totalBytes: totalBytes as number,
      availableBytes: availableBytes as number,
      usedBytes: (totalBytes as number) - (availableBytes as number),
    }
  return {
    capturedAt: Date.now(),
    host: {
      ...raw.computerName ? { computerName: raw.computerName } : {},
      ...raw.osVersion ? { osVersion: raw.osVersion } : {},
    },
    cpu: arrayOf(raw.cpu).flatMap((item) => {
      if (!item.Name) return []
      const loadPercent = numberOrUndefined(item.LoadPercentage)
      return [{ name: item.Name, ...loadPercent === undefined ? {} : { loadPercent } }]
    }),
    ...memory === undefined ? {} : {
      memory: { ...memory, usedPercent: memory.totalBytes === 0 ? 0 : memory.usedBytes / memory.totalBytes * 100 },
    },
    gpu: arrayOf(raw.gpu).flatMap((item) => {
      if (!item.Name) return []
      const memoryBytes = numberOrUndefined(item.AdapterRAM)
      return [{ name: item.Name, ...memoryBytes === undefined ? {} : { memoryBytes } }]
    }),
  }
}

function readText(reader: SubprocessOutputReader | undefined): string {
  if (reader === undefined) throw new Error('hardware-monitor-windows: subprocess did not collect stdout')
  return reader.readFrom(0).text.trim()
}

/** Local Windows CIM implementation of {@link HardwareMonitor}. */
export class WindowsHardwareMonitor extends HardwareMonitor {
  static inject = ['subprocess']

  static Config: z<Config> = z.object({
    timeoutMs: z.number().min(1).default(10_000),
    maxOutputBytes: z.number().min(1).default(256 * 1024),
  })

  private readonly subprocess: SubprocessRuntime
  private readonly config: Required<Config>
  private source: () => ResolvedHardwareMonitorSettings
  private readonly listeners = new Set<HardwareSnapshotListener>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private sampling = false
  private disposed = false

  constructor(ctx: Context, config: Config) {
    if (process.platform !== 'win32') {
      throw new Error('@deepseek-ai/dsh-hardware-monitor-windows requires Windows')
    }
    super(ctx)
    this.subprocess = ctx.subprocess
    this.config = config as Required<Config>
    const entry: ResolvedHardwareMonitorSettings = {
      enabled: true,
      intervalMs: DEFAULT_INTERVAL_MS,
      categories: [...DEFAULT_CATEGORIES],
      sensorNames: [],
    }
    this.source = () => entry
    ctx.inject(['settings'], (settingsCtx) => {
      settingsCtx.settings.installSection(ctx, HARDWARE_MONITOR_SETTINGS_NAMESPACE, HardwareMonitorSettingsSchema, entry, {
        validate: validateSettings,
        setSource: (current) => { this.source = current as () => ResolvedHardwareMonitorSettings },
        onChange: () => { this.restartSampling() },
      })
    })
    ctx.effect(() => () => {
      this.disposed = true
      this.stopSampling()
    }, 'hardware-monitor-windows sampling')
  }

  subscribe(listener: HardwareSnapshotListener): () => void {
    if (this.disposed) throw new Error('hardware-monitor-windows: provider is disposed')
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.restartSampling()
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0) this.stopSampling()
    }
  }

  private restartSampling(): void {
    this.stopSampling()
    if (this.listeners.size === 0 || !this.source().enabled || this.disposed) return
    void this.sampleAndSchedule()
  }

  private stopSampling(): void {
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.timer = undefined
  }

  private async sampleAndSchedule(): Promise<void> {
    if (this.sampling || this.listeners.size === 0 || this.disposed || !this.source().enabled) return
    this.sampling = true
    try {
      const snapshot = await this.snapshot()
      for (const listener of this.listeners) listener(snapshot)
    } finally {
      this.sampling = false
      if (this.listeners.size > 0 && !this.disposed && this.source().enabled) {
        this.timer = setTimeout(() => { this.timer = undefined; void this.sampleAndSchedule() }, this.source().intervalMs)
      }
    }
  }

  async snapshot(request: HardwareSnapshotRequest = {}): Promise<HardwareSnapshot> {
    const settings = this.source()
    validateSettings(settings)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
    const abort = () => controller.abort()
    request.signal?.addEventListener('abort', abort, { once: true })
    const handle = this.subprocess.spawn({
      argv: ['powershell.exe', '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', queryFor(settings)],
      cwd: process.cwd(),
      stdio: { stdin: 'ignore', stdout: { maxBytes: this.config.maxOutputBytes }, stderr: { maxBytes: 16 * 1024 } },
      graceMs: 1000,
      signal: controller.signal,
    })
    try {
      const outcome = await handle.done
      if (outcome.exitCode !== 0 || outcome.signal !== null) {
        const error = readText(handle.collected.stderr)
        throw new Error(`hardware-monitor-windows: CIM query failed (${error || `exit code ${outcome.exitCode}`})`)
      }
      return parseSnapshot(readText(handle.collected.stdout))
    } finally {
      clearTimeout(timeout)
      request.signal?.removeEventListener('abort', abort)
    }
  }
}

export default WindowsHardwareMonitor
