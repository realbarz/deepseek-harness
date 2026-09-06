/** Platform-neutral hardware telemetry service definition. */
import { Context, Service } from '@deepseek-ai/cordis'
import type { HardwareSnapshot, HardwareSnapshotListener, HardwareSnapshotRequest } from './types.ts'

export type {
  HardwareMonitorSettings,
  HardwareSensorCategory,
  HardwareSnapshot,
  HardwareSnapshotListener,
  HardwareSnapshotRequest,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    hardwareMonitor: HardwareMonitor
  }
}

/**
 * Read-only host telemetry service. Providers own platform APIs and sampling
 * policy; consumers receive one normalized snapshot and never call CIM/WMI.
 */
export abstract class HardwareMonitor extends Service {
  constructor(ctx: Context) {
    super(ctx, 'hardwareMonitor')
  }

  /**
   * Capture one bounded point-in-time snapshot.
   * @param request - optional cancellation signal.
   * @returns normalized host, processor, memory, and graphics facts.
   */
  abstract snapshot(request?: HardwareSnapshotRequest): Promise<HardwareSnapshot>

  /**
   * Subscribe to bounded live snapshots. The provider starts sampling for the
   * first subscriber and stops after the final disposer runs.
   * @param listener - receives completed snapshots only.
   * @returns disposer for this subscription.
   */
  abstract subscribe(listener: HardwareSnapshotListener): () => void
}

export default HardwareMonitor
