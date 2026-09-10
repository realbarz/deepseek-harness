/** A point-in-time host telemetry snapshot. */
export interface HardwareSnapshot {
  capturedAt: number
  host: {
    computerName?: string
    osVersion?: string
  }
  cpu: readonly {
    name: string
    loadPercent?: number
    temperatureC?: number
  }[]
  memory?: {
    totalBytes: number
    availableBytes: number
    usedBytes: number
    usedPercent: number
  }
  gpu: readonly {
    name: string
    memoryBytes?: number
    temperatureC?: number
  }[]
}

/** Options applied before a provider queries the host. */
export interface HardwareSnapshotRequest {
  signal?: AbortSignal
}

/** Receives one normalized snapshot from an active host sampler. */
export type HardwareSnapshotListener = (snapshot: HardwareSnapshot) => void

/** Host sensor groups supported by the Windows provider. */
export type HardwareSensorCategory = 'cpu' | 'memory' | 'gpu'

/** User-editable sampling and sensor-selection settings. */
export interface HardwareMonitorSettings {
  enabled?: boolean
  intervalMs?: number
  categories?: HardwareSensorCategory[]
  sensorNames?: string[]
}
