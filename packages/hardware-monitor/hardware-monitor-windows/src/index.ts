/** Windows CIM + OpenHardwareMonitor provider for the hardware telemetry service. */
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
  /** Maximum time allowed for one CIM/OHM query. */
  timeoutMs?: number
  /** Maximum retained stdout bytes. */
  maxOutputBytes?: number
}

export const HARDWARE_MONITOR_SETTINGS_NAMESPACE = 'hardware-monitor'

const DEFAULT_INTERVAL_MS = 2_000
const DEFAULT_CATEGORIES: readonly HardwareSensorCategory[] = ['cpu', 'memory', 'gpu', 'disk']
const MAX_SENSOR_NAMES = 32
const MAX_SENSOR_NAME_LENGTH = 160

export const HardwareMonitorSettingsSchema: z<HardwareMonitorSettings> = z.object({
  enabled: z.boolean().default(true),
  intervalMs: z.number().step(1).min(250).max(60_000).default(DEFAULT_INTERVAL_MS),
  categories: z.array(z.union(['cpu', 'memory', 'gpu', 'disk'] as const)).default([...DEFAULT_CATEGORIES]),
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

  const cpuCim = categories.has('cpu')
    ? `$cpuCim = @(Get-CimInstance Win32_Processor${sensorFilter} | Select-Object Name, LoadPercentage, CurrentClockSpeed, NumberOfCores)`
    : '$cpuCim = @()'
  const os = categories.has('memory')
    ? '$os = Get-CimInstance Win32_OperatingSystem'
    : '$os = $null'
  const gpuCim = categories.has('gpu')
    ? `$gpuCim = @(Get-CimInstance Win32_VideoController${sensorFilter} | Select-Object Name, AdapterRAM)`
    : '$gpuCim = @()'
  const diskCim = categories.has('disk')
    ? '$diskCim = @(Get-CimInstance Win32_DiskDrive | Select-Object Name, Model, Index)'
    : '$diskCim = @()'
  const hasDisk = categories.has('disk') ? '$true' : '$false'
  const cpuPdh = categories.has('cpu') ? `
try {
  $coreSamples = (Get-Counter '\\Processor(*)\\% Processor Time' -ErrorAction Stop).CounterSamples |
    Where-Object { $_.InstanceName -ne '_total' } | Sort-Object InstanceName
  $cpuCorePcts = @($coreSamples | ForEach-Object { [double]$_.CookedValue })
} catch { $cpuCorePcts = @() }` : ''

  const diskPdh = categories.has('disk') ? `
try {
  (Get-Counter '\\PhysicalDisk(*)\\Disk Read Bytes/sec' -ErrorAction Stop).CounterSamples |
    Where-Object { $_.InstanceName -ne '_total' } | ForEach-Object { $diskReadRates[$_.InstanceName] = [double]$_.CookedValue }
  (Get-Counter '\\PhysicalDisk(*)\\Disk Write Bytes/sec' -ErrorAction Stop).CounterSamples |
    Where-Object { $_.InstanceName -ne '_total' } | ForEach-Object { $diskWriteRates[$_.InstanceName] = [double]$_.CookedValue }
  (Get-Counter '\\PhysicalDisk(*)\\% Disk Time' -ErrorAction Stop).CounterSamples |
    Where-Object { $_.InstanceName -ne '_total' } | ForEach-Object { $diskActivity[$_.InstanceName] = [double]$_.CookedValue }
} catch {}` : ''

  return `
${cpuCim}
${os}
${gpuCim}
${diskCim}
$hasDisk = ${hasDisk}

# Try OHM/LHM WMI provider; degrade gracefully when not running.
$ohmSensors = @()
try {
  $ohmSensors = @(Get-WmiObject -Namespace root\\OpenHardwareMonitor -Class Sensor -ErrorAction Stop |
    Select-Object Identifier, Name, SensorType, Value, Parent)
} catch { $ohmSensors = @() }

# PDH per-core CPU loads
$cpuCorePcts = @()
${cpuPdh}

# PDH disk rates
$diskReadRates = @{}
$diskWriteRates = @{}
$diskActivity = @{}
${diskPdh}

# Group OHM sensors by parent hardware path
$cpuSensorsByParent = @{}
$gpuSensorsByParent = @{}
$diskSensorsByParent = @{}
foreach ($s in $ohmSensors) {
  $id = [string]$s.Identifier
  $p  = [string]$s.Parent
  if ($id -match '/cpu/')            { if (-not $cpuSensorsByParent[$p])  { $cpuSensorsByParent[$p]  = @() }; $cpuSensorsByParent[$p]  += $s }
  elseif ($id -match '/gpu')         { if (-not $gpuSensorsByParent[$p])  { $gpuSensorsByParent[$p]  = @() }; $gpuSensorsByParent[$p]  += $s }
  elseif ($id -match '/hdd/' -or $id -match '/nvme/') { if (-not $diskSensorsByParent[$p]) { $diskSensorsByParent[$p] = @() }; $diskSensorsByParent[$p] += $s }
}

function Get-OhmValue($sensors, [string]$type, [string]$nameLike) {
  $s = @($sensors | Where-Object { $_.SensorType -eq $type -and $_.Name -like $nameLike }) | Select-Object -First 1
  if ($s) { return [double]$s.Value } else { return $null }
}
function Get-OhmArray($sensors, [string]$type, [string]$nameLike) {
  $arr = @($sensors | Where-Object { $_.SensorType -eq $type -and $_.Name -like $nameLike } | Sort-Object Name | ForEach-Object { [double]$_.Value })
  if ($arr.Count -gt 0) { return ,$arr } else { return $null }
}

# Assemble CPU objects
$cpuParentKeys = @($cpuSensorsByParent.Keys)
$cpuResults = @(for ($i = 0; $i -lt $cpuCim.Count; $i++) {
  $cim  = $cpuCim[$i]
  $sens = if ($i -lt $cpuParentKeys.Count) { $cpuSensorsByParent[$cpuParentKeys[$i]] } else { @() }
  [pscustomobject]@{
    name              = [string]$cim.Name
    loadPercent       = if ($cim.LoadPercentage -ne $null) { [double]$cim.LoadPercentage } else { $null }
    coreLoadPercents  = if ($cpuCorePcts.Count -gt 0) { ,$cpuCorePcts } else { Get-OhmArray $sens 'Load' 'CPU Core #*' }
    temperatureC      = Get-OhmValue $sens 'Temperature' 'CPU Package'
    coreTemperaturesC = Get-OhmArray $sens 'Temperature' 'CPU Core #*'
    packagePowerW     = Get-OhmValue $sens 'Power' 'CPU Package'
    maxCoreMhz        = if ($cim.CurrentClockSpeed) { [double]$cim.CurrentClockSpeed } else { $null }
    bclkMhz           = Get-OhmValue $sens 'Clock' 'Bus Speed'
    voltageV          = Get-OhmValue $sens 'Voltage' 'CPU VCore'
  }
})

# Assemble GPU objects
$gpuParentKeys = @($gpuSensorsByParent.Keys)
$gpuResults = @(for ($i = 0; $i -lt $gpuCim.Count; $i++) {
  $cim  = $gpuCim[$i]
  $sens = if ($i -lt $gpuParentKeys.Count) { $gpuSensorsByParent[$gpuParentKeys[$i]] } else { @() }
  [pscustomobject]@{
    name               = [string]$cim.Name
    memoryBytes        = if ($cim.AdapterRAM -gt 0) { [double]$cim.AdapterRAM } else { $null }
    loadPercent        = Get-OhmValue $sens 'Load' 'GPU Core'
    temperatureC       = Get-OhmValue $sens 'Temperature' 'GPU Core'
    hotSpotC           = Get-OhmValue $sens 'Temperature' 'GPU Hot Spot'
    memoryTemperatureC = Get-OhmValue $sens 'Temperature' 'GPU Memory'
    powerW             = Get-OhmValue $sens 'Power' 'GPU Package'
    voltageV           = Get-OhmValue $sens 'Voltage' 'GPU Core'
    coreMhz            = Get-OhmValue $sens 'Clock' 'GPU Core'
    memoryMhz          = Get-OhmValue $sens 'Clock' 'GPU Memory'
    fansRpm            = Get-OhmArray $sens 'Fan' '*'
  }
})

# Assemble Disk objects
$diskResults = $null
if ($hasDisk) {
  $diskParentKeys = @($diskSensorsByParent.Keys)
  $diskResults = @(for ($i = 0; $i -lt $diskCim.Count; $i++) {
    $cim  = $diskCim[$i]
    $sens = if ($i -lt $diskParentKeys.Count) { $diskSensorsByParent[$diskParentKeys[$i]] } else { @() }
    $idx  = [string]$cim.Index
    $pdhKey = @($diskReadRates.Keys | Where-Object { $_ -match "^$idx " }) | Select-Object -First 1
    [pscustomobject]@{
      name             = [string]$cim.Model
      temperatureC     = Get-OhmValue $sens 'Temperature' 'Temperature'
      activityPercent  = if ($pdhKey -and $diskActivity.ContainsKey($pdhKey))   { $diskActivity[$pdhKey]   } else { $null }
      readBytesPerSec  = if ($pdhKey -and $diskReadRates.ContainsKey($pdhKey))  { $diskReadRates[$pdhKey]  } else { $null }
      writeBytesPerSec = if ($pdhKey -and $diskWriteRates.ContainsKey($pdhKey)) { $diskWriteRates[$pdhKey] } else { $null }
    }
  })
}

[pscustomobject]@{
  computerName = $env:COMPUTERNAME
  osVersion    = if ($os) { [string]$os.Version } else { $null }
  cpu          = $cpuResults
  memory       = if ($os) { [pscustomobject]@{
    totalBytes            = [double]$os.TotalVisibleMemorySize * 1024
    availableBytes        = [double]$os.FreePhysicalMemory * 1024
    virtualTotalBytes     = [double]$os.TotalVirtualMemorySize * 1024
    virtualAvailableBytes = [double]$os.FreeVirtualMemory * 1024
  } } else { $null }
  gpu          = $gpuResults
  disk         = $diskResults
} | ConvertTo-Json -Compress -Depth 6
`
}

interface RawCpu {
  name?: string
  loadPercent?: number | null
  coreLoadPercents?: unknown[] | null
  temperatureC?: number | null
  coreTemperaturesC?: unknown[] | null
  packagePowerW?: number | null
  maxCoreMhz?: number | null
  bclkMhz?: number | null
  voltageV?: number | null
}

interface RawGpu {
  name?: string
  memoryBytes?: number | null
  loadPercent?: number | null
  temperatureC?: number | null
  hotSpotC?: number | null
  memoryTemperatureC?: number | null
  powerW?: number | null
  voltageV?: number | null
  coreMhz?: number | null
  memoryMhz?: number | null
  fansRpm?: unknown[] | null
}

interface RawDisk {
  name?: string
  temperatureC?: number | null
  activityPercent?: number | null
  readBytesPerSec?: number | null
  writeBytesPerSec?: number | null
}

interface RawSnapshot {
  computerName?: string
  osVersion?: string
  cpu?: readonly RawCpu[] | RawCpu
  memory?: {
    totalBytes?: number
    availableBytes?: number
    virtualTotalBytes?: number
    virtualAvailableBytes?: number
  } | null
  gpu?: readonly RawGpu[] | RawGpu
  disk?: readonly RawDisk[] | RawDisk | null
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function positiveOrUndefined(value: unknown): number | undefined {
  const n = numberOrUndefined(value)
  return n !== undefined && n >= 0 ? n : undefined
}

function numberArrayOrUndefined(value: unknown): readonly number[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  const out: number[] = []
  for (const v of value) {
    const n = numberOrUndefined(v)
    if (n === undefined) return undefined
    out.push(n)
  }
  return out
}

function arrayOf<T>(value: T | readonly T[] | undefined | null): readonly T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value as T]
}

/** Parse one CIM+OHM+PDH JSON payload into a normalized {@link HardwareSnapshot}. */
export function parseSnapshot(text: string): HardwareSnapshot {
  const raw = JSON.parse(text) as RawSnapshot
  const totalBytes = numberOrUndefined(raw.memory?.totalBytes)
  const availableBytes = numberOrUndefined(raw.memory?.availableBytes)
  if (raw.memory !== null && raw.memory !== undefined
    && (totalBytes === undefined || availableBytes === undefined || totalBytes < 0 || availableBytes < 0 || availableBytes > totalBytes)) {
    throw new Error('hardware-monitor-windows: CIM returned invalid memory totals')
  }
  const memory: HardwareSnapshot['memory'] | undefined = raw.memory == null
    ? undefined
    : (() => {
      const vt = positiveOrUndefined(raw.memory.virtualTotalBytes)
      const va = positiveOrUndefined(raw.memory.virtualAvailableBytes)
      return {
        totalBytes: totalBytes as number,
        availableBytes: availableBytes as number,
        usedBytes: (totalBytes as number) - (availableBytes as number),
        usedPercent:
          (totalBytes as number) === 0
            ? 0
            : ((totalBytes as number) - (availableBytes as number)) / (totalBytes as number) * 100,
        ...(vt !== undefined ? { virtualTotalBytes: vt } : {}),
        ...(va !== undefined ? { virtualAvailableBytes: va } : {}),
      }
    })()
  const cpu: HardwareSnapshot['cpu'] = arrayOf(raw.cpu).flatMap((item) => {
    if (!item.name) return []
    const entry: Record<string, unknown> = { name: item.name }
    const loadPercent = positiveOrUndefined(item.loadPercent)
    if (loadPercent !== undefined) entry['loadPercent'] = loadPercent
    const coreLoadPercents = numberArrayOrUndefined(item.coreLoadPercents)
    if (coreLoadPercents !== undefined) entry['coreLoadPercents'] = coreLoadPercents
    const temperatureC = numberOrUndefined(item.temperatureC)
    if (temperatureC !== undefined) entry['temperatureC'] = temperatureC
    const coreTemperaturesC = numberArrayOrUndefined(item.coreTemperaturesC)
    if (coreTemperaturesC !== undefined) entry['coreTemperaturesC'] = coreTemperaturesC
    const packagePowerW = positiveOrUndefined(item.packagePowerW)
    if (packagePowerW !== undefined) entry['packagePowerW'] = packagePowerW
    const maxCoreMhz = positiveOrUndefined(item.maxCoreMhz)
    if (maxCoreMhz !== undefined) entry['maxCoreMhz'] = maxCoreMhz
    const bclkMhz = positiveOrUndefined(item.bclkMhz)
    if (bclkMhz !== undefined) entry['bclkMhz'] = bclkMhz
    const voltageV = positiveOrUndefined(item.voltageV)
    if (voltageV !== undefined) entry['voltageV'] = voltageV
    return [entry as HardwareSnapshot['cpu'][number]]
  })
  const gpu: HardwareSnapshot['gpu'] = arrayOf(raw.gpu).flatMap((item) => {
    if (!item.name) return []
    const entry: Record<string, unknown> = { name: item.name }
    const memoryBytes = positiveOrUndefined(item.memoryBytes)
    if (memoryBytes !== undefined) entry['memoryBytes'] = memoryBytes
    const loadPercent = positiveOrUndefined(item.loadPercent)
    if (loadPercent !== undefined) entry['loadPercent'] = loadPercent
    const temperatureC = numberOrUndefined(item.temperatureC)
    if (temperatureC !== undefined) entry['temperatureC'] = temperatureC
    const hotSpotC = numberOrUndefined(item.hotSpotC)
    if (hotSpotC !== undefined) entry['hotSpotC'] = hotSpotC
    const memoryTemperatureC = numberOrUndefined(item.memoryTemperatureC)
    if (memoryTemperatureC !== undefined) entry['memoryTemperatureC'] = memoryTemperatureC
    const powerW = positiveOrUndefined(item.powerW)
    if (powerW !== undefined) entry['powerW'] = powerW
    const voltageV = positiveOrUndefined(item.voltageV)
    if (voltageV !== undefined) entry['voltageV'] = voltageV
    const coreMhz = positiveOrUndefined(item.coreMhz)
    if (coreMhz !== undefined) entry['coreMhz'] = coreMhz
    const memoryMhz = positiveOrUndefined(item.memoryMhz)
    if (memoryMhz !== undefined) entry['memoryMhz'] = memoryMhz
    const fansRpm = numberArrayOrUndefined(item.fansRpm)
    if (fansRpm !== undefined) entry['fansRpm'] = fansRpm
    return [entry as HardwareSnapshot['gpu'][number]]
  })
  const rawDisks = raw.disk == null ? undefined : arrayOf(raw.disk)
  const disks: HardwareSnapshot['disks'] | undefined = rawDisks === undefined
    ? undefined
    : rawDisks.flatMap((item) => {
      if (!item.name) return []
      const entry: Record<string, unknown> = { name: item.name }
      const temperatureC = numberOrUndefined(item.temperatureC)
      if (temperatureC !== undefined) entry['temperatureC'] = temperatureC
      const activityPercent = positiveOrUndefined(item.activityPercent)
      if (activityPercent !== undefined) entry['activityPercent'] = activityPercent
      const readBytesPerSec = positiveOrUndefined(item.readBytesPerSec)
      if (readBytesPerSec !== undefined) entry['readBytesPerSec'] = readBytesPerSec
      const writeBytesPerSec = positiveOrUndefined(item.writeBytesPerSec)
      if (writeBytesPerSec !== undefined) entry['writeBytesPerSec'] = writeBytesPerSec
      return [entry as NonNullable<HardwareSnapshot['disks']>[number]]
    })
  return {
    capturedAt: Date.now(),
    host: {
      ...(raw.computerName ? { computerName: raw.computerName } : {}),
      ...(raw.osVersion ? { osVersion: raw.osVersion } : {}),
    },
    cpu,
    ...(memory === undefined ? {} : { memory }),
    gpu,
    ...(disks === undefined ? {} : { disks }),
  }
}

function readText(reader: SubprocessOutputReader | undefined): string {
  if (reader === undefined) throw new Error('hardware-monitor-windows: subprocess did not collect stdout')
  return reader.readFrom(0).text.trim()
}

/** Local Windows CIM + OpenHardwareMonitor implementation of {@link HardwareMonitor}. */
export class WindowsHardwareMonitor extends HardwareMonitor {
  static inject = ['subprocess']

  static Config: z<Config> = z.object({
    timeoutMs: z.number().min(1).default(10_000),
    maxOutputBytes: z.number().min(1).default(512 * 1024),
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
      const settings = this.source()
      // eslint-disable-next-line typescript/no-unnecessary-condition
      if (this.listeners.size > 0 && !this.disposed) {
        if (settings.enabled) {
          this.timer = setTimeout(() => {
            this.timer = undefined
            void this.sampleAndSchedule()
          }, settings.intervalMs)
        }
      }
    }
  }

  async snapshot(request: HardwareSnapshotRequest = {}): Promise<HardwareSnapshot> {
    const settings = this.source()
    validateSettings(settings)
    const controller = new AbortController()
    const timeout = setTimeout(() => { controller.abort() }, this.config.timeoutMs)
    const abort = (): void => { controller.abort() }
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
