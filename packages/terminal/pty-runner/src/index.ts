/**
 * Interactive persistent PTY and subprocess session runner.
 * @module @deepseek-ai/dsh-pty-runner
 */

import type { Context } from '@deepseek-ai/cordis'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import z from '@deepseek-ai/schemastery'

export const name = 'pty-runner'

export interface PtySession {
  readonly id: string
  readonly command: string
  readonly process: ChildProcessWithoutNullStreams
  readonly buffer: string[]
  exitCode: number | null
}

export interface Config {
  maxBufferLines?: number
}

export const Config: z<Config> = z.object({
  maxBufferLines: z.number().min(100).default(5000),
})

export class PtyRunnerService {
  private readonly sessions = new Map<string, PtySession>()

  constructor(public ctx: Context, public config: Config) {}

  spawnSession(id: string, command: string, args: readonly string[] = []): PtySession {
    if (this.sessions.has(id)) {
      this.killSession(id)
    }

    const child = spawn(command, args as string[], {
      shell: true,
      env: process.env,
    })

    const session: PtySession = {
      id,
      command: `${command} ${args.join(' ')}`,
      process: child,
      buffer: [],
      exitCode: null,
    }

    const maxLines = this.config.maxBufferLines ?? 5000

    child.stdout.on('data', (data) => {
      const text = data.toString()
      for (const line of text.split(/\r?\n/)) {
        session.buffer.push(line)
        if (session.buffer.length > maxLines) {
          session.buffer.shift()
        }
      }
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      for (const line of text.split(/\r?\n/)) {
        session.buffer.push(`[stderr] ${line}`)
        if (session.buffer.length > maxLines) {
          session.buffer.shift()
        }
      }
    })

    child.on('exit', (code) => {
      session.exitCode = code ?? 0
    })

    this.sessions.set(id, session)
    return session
  }

  writeSession(id: string, input: string): void {
    const session = this.sessions.get(id)
    if (session && session.exitCode === null) {
      session.process.stdin.write(input)
    }
  }

  readSessionBuffer(id: string): readonly string[] {
    const session = this.sessions.get(id)
    return session ? [...session.buffer] : []
  }

  killSession(id: string): void {
    const session = this.sessions.get(id)
    if (session && session.exitCode === null) {
      session.process.kill()
      session.exitCode = -1
    }
    this.sessions.delete(id)
  }

  stopAll(): void {
    for (const id of this.sessions.keys()) {
      this.killSession(id)
    }
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new PtyRunnerService(ctx, config)
  ctx.provide('ptyRunner', service)
  ctx.effect(() => {
    return () => {
      service.stopAll()
    }
  }, 'pty-runner.teardown')
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    ptyRunner: PtyRunnerService
  }
}
