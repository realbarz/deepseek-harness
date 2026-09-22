/**
 * Persistent background daemon worker engine.
 * @module @deepseek-ai/dsh-daemon-worker
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'daemon-worker'
export const inject = ['jobs']

export interface DaemonTask {
  readonly id: string
  readonly name: string
  readonly intervalMs: number
  readonly run: () => Promise<void>
}

export interface Config {
  enabled?: boolean
  defaultIntervalMs?: number
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  defaultIntervalMs: z.number().min(1000).default(60_000),
})

export class DaemonWorkerService {
  private readonly tasks = new Map<string, DaemonTask>()
  private readonly timers = new Map<string, NodeJS.Timeout>()

  constructor(public ctx: Context, public config: Config) {}

  register(task: DaemonTask): void {
    this.tasks.set(task.id, task)
    if (this.config.enabled) {
      this.startTaskTimer(task)
    }
  }

  unregister(taskId: string): void {
    const timer = this.timers.get(taskId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(taskId)
    }
    this.tasks.delete(taskId)
  }

  private startTaskTimer(task: DaemonTask): void {
    const existing = this.timers.get(task.id)
    if (existing) clearInterval(existing)

    const interval = task.intervalMs > 0 ? task.intervalMs : (this.config.defaultIntervalMs ?? 60_000)
    const timer = setInterval(async () => {
      try {
        await task.run()
      } catch {
        // Suppress unhandled rejections in background worker loops
      }
    }, interval)

    this.timers.set(task.id, timer)
  }

  stopAll(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer)
    }
    this.timers.clear()
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new DaemonWorkerService(ctx, config)
  ctx.provide('daemonWorker', service)
  ctx.effect(() => {
    return () => {
      service.stopAll()
    }
  }, 'daemon-worker.teardown')
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    daemonWorker: DaemonWorkerService
  }
}
