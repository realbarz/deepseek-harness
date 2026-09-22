/**
 * Bidirectional Typert Remote Hub bridge.
 * @module @deepseek-ai/dsh-remote-hub
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'remote-hub'

export interface RpcProcedure {
  readonly method: string
  readonly handler: (params: unknown) => Promise<unknown>
}

export interface Config {
  enabled?: boolean
}

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
})

export class RemoteHubService {
  private readonly procedures = new Map<string, (params: unknown) => Promise<unknown>>()

  constructor(public ctx: Context, public config: Config) {}

  register(method: string, handler: (params: unknown) => Promise<unknown>): void {
    this.procedures.set(method, handler)
  }

  async invoke(method: string, params: unknown): Promise<unknown> {
    const handler = this.procedures.get(method)
    if (!handler) {
      throw new Error(`RemoteHub: procedure "${method}" is not registered`)
    }
    return handler(params)
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new RemoteHubService(ctx, config)
  ctx.provide('remoteHub', service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    remoteHub: RemoteHubService
  }
}
