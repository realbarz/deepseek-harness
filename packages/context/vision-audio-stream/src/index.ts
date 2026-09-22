/**
 * Multi-modal audio transcription and screen vision stream ingest.
 * @module @deepseek-ai/dsh-vision-audio-stream
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'vision-audio-stream'

export interface StreamFrame {
  readonly timestamp: number
  readonly type: 'audio' | 'vision'
  readonly content: string
}

export interface Config {
  maxWindowItems?: number
}

export const Config: z<Config> = z.object({
  maxWindowItems: z.number().min(50).default(1000),
})

export class VisionAudioStreamService {
  private readonly buffer: StreamFrame[] = []

  constructor(public ctx: Context, public config: Config) {}

  push(type: 'audio' | 'vision', content: string): void {
    const maxItems = this.config.maxWindowItems ?? 1000
    this.buffer.push({
      timestamp: Date.now(),
      type,
      content,
    })

    if (this.buffer.length > maxItems) {
      this.buffer.shift()
    }
  }

  getRecentContext(limit = 20): readonly StreamFrame[] {
    return this.buffer.slice(-limit)
  }

  clear(): void {
    this.buffer.length = 0
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new VisionAudioStreamService(ctx, config)
  ctx.provide('visionAudioStream', service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    visionAudioStream: VisionAudioStreamService
  }
}
