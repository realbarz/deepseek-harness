/** A point-in-time host telemetry snapshot. */
export interface HardwareSnapshot {
  capturedAt: number
  host: {
    computerName?: string
    osVersion?: string
  }
  cpu: readonly {
    name: string
    /** Overall processor utilization 0–100. */
    loadPercent?: number
    /** Per-core utilization 0–100, index-aligned to physical cores. */
    coreLoadPercents?: readonly number[]
    /** CPU package temperature in Celsius. */
    temperatureC?: number
    /** Per-core temperatures in Celsius, index-aligned to physical cores. */
    coreTemperaturesC?: readonly number[]
    /** CPU package power draw in watts. */
    packagePowerW?: number
    /** Maximum boosted core frequency in MHz. */
    maxCoreMhz?: number
    /** Memory controller reference clock in MHz. */
    bclkMhz?: number
    /** CPU core voltage in volts. */
    voltageV?: number
  }[]
  memory?: {
    totalBytes: number
    availableBytes: number
    usedBytes: number
    usedPercent: number
    /** Total virtual/page memory in bytes. */
    virtualTotalBytes?: number
    /** Available virtual/page memory in bytes. */
    virtualAvailableBytes?: number
  }
  gpu: readonly {
    name: string
    /** Adapter VRAM size in bytes. */
    memoryBytes?: number
    /** GPU core utilization 0–100. */
    loadPercent?: number
    /** GPU die temperature in Celsius. */
    temperatureC?: number
    /** GPU memory junction temperature in Celsius. */
    hotSpotC?: number
    /** GPU VRAM temperature in Celsius. */
    memoryTemperatureC?: number
    /** GPU total power draw in watts. */
    powerW?: number
    /** GPU core voltage in volts. */
    voltageV?: number
    /** GPU core clock in MHz. */
    coreMhz?: number
    /** GPU memory clock in MHz. */
    memoryMhz?: number
    /** Fan speeds in RPM, index-aligned to fan connectors. */
    fansRpm?: readonly number[]
  }[]
  /** Physical storage devices with live telemetry. */
  disks?: readonly {
    name: string
    /** Disk temperature in Celsius from OHM or SMART. */
    temperatureC?: number
    /** Disk busy time 0–100. */
    activityPercent?: number
    /** Sequential read throughput in bytes per second. */
    readBytesPerSec?: number
    /** Sequential write throughput in bytes per second. */
    writeBytesPerSec?: number
  }[]
}

/** Options applied before a provider queries the host. */
export interface HardwareSnapshotRequest {
  signal?: AbortSignal
}

/** Receives one normalized snapshot from an active host sampler. */
export type HardwareSnapshotListener = (snapshot: HardwareSnapshot) => void

/** Host sensor groups supported by the Windows provider. */
export type HardwareSensorCategory = 'cpu' | 'memory' | 'gpu' | 'disk'

/** User-editable sampling and sensor-selection settings. */
export interface HardwareMonitorSettings {
  enabled?: boolean
  intervalMs?: number
  categories?: HardwareSensorCategory[]
  sensorNames?: string[]
}
