import type { HardwareSnapshot } from '@deepseek-ai/dsh-hardware-monitor'
import type { SessionHardwareMonitorFrame } from '@deepseek-ai/dsh-api-session-controller/types'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'

type Listener = () => void

export interface HardwareMonitorView {
  status: 'stopped' | 'connecting' | 'live' | 'error'
  snapshot?: HardwareSnapshot
  error?: string
}

/** Owns one reconnecting stream per selected Session and exposes immutable views. */
export class HardwareMonitorController {
  private readonly views = new Map<string, HardwareMonitorView>()
  private readonly controllers = new Map<string, AbortController>()
  private readonly listeners = new Set<Listener>()

  constructor(private readonly ctx: Context) {}

  get(sessionId: string): HardwareMonitorView {
    return this.views.get(sessionId) ?? { status: 'stopped' }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  start(sessionId: string): void {
    if (this.controllers.has(sessionId)) return
    const current = this.get(sessionId)
    this.publish(sessionId, { status: 'connecting', ...current.error === undefined ? {} : { error: current.error }, ...current.snapshot === undefined ? {} : { snapshot: current.snapshot } })
    const controller = new AbortController()
    this.controllers.set(sessionId, controller)
    const remote = this.ctx.remote as unknown as {
      session: {
        hardwareMonitorStream(request: { sessionId: string }, signal: AbortSignal): AsyncIterable<SessionHardwareMonitorFrame>
      }
    }
    void (async () => {
      try {
        for await (const frame of remote.session.hardwareMonitorStream({ sessionId }, controller.signal)) {
          this.publish(sessionId, { status: 'live', snapshot: frame.snapshot })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        this.controllers.delete(sessionId)
        this.publish(sessionId, {
          ...this.get(sessionId),
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })()
  }

  async stop(sessionId: string): Promise<void> {
    const controller = this.controllers.get(sessionId)
    this.controllers.delete(sessionId)
    if (controller !== undefined) controller.abort()
    this.publish(sessionId, { ...this.get(sessionId), status: 'stopped' })
  }

  /** Queue the latest current snapshot for the Session's next prompt. */
  async attachNextPrompt(sessionId: string): Promise<void> {
    const remote = this.ctx.remote as unknown as {
      session: { hardwareMonitorAttach(request: { sessionId: string }): Promise<unknown> }
    }
    await remote.session.hardwareMonitorAttach({ sessionId })
  }

  async dispose(): Promise<void> {
    for (const [sessionId] of this.controllers) {
      await this.stop(sessionId)
    }
    this.listeners.clear()
  }

  private publish(sessionId: string, view: HardwareMonitorView): void {
    this.views.set(sessionId, view)
    for (const listener of this.listeners) listener()
  }
}
