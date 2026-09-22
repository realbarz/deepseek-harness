/**
 * Dynamic local-to-cloud model router.
 * @module @deepseek-ai/dsh-model-router
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'model-router'

export type ModelTier = 'local-fast' | 'cloud-frontier' | 'cloud-reasoner'

export interface RoutingDecision {
  readonly targetTier: ModelTier
  readonly modelId: string
  readonly reason: string
}

export interface Config {
  defaultLocalModel?: string
  defaultCloudModel?: string
  forceCloud?: boolean
}

export const Config: z<Config> = z.object({
  defaultLocalModel: z.string().default('qwen2.5-coder:14b-instruct'),
  defaultCloudModel: z.string().default('deepseek-chat'),
  forceCloud: z.boolean().default(false),
})

export class ModelRouterService {
  constructor(public ctx: Context, public config: Config) {}

  route(prompt: string, tokenEstimate = 500): RoutingDecision {
    if (this.config.forceCloud) {
      return {
        targetTier: 'cloud-frontier',
        modelId: this.config.defaultCloudModel ?? 'deepseek-chat',
        reason: 'Forced cloud execution by configuration override.',
      }
    }

    const lower = prompt.toLowerCase()
    const isCodingTask = lower.includes('function') || lower.includes('code') || lower.includes('debug') || lower.includes('refactor')
    const isComplexPlanning = lower.includes('architecture') || lower.includes('system design') || tokenEstimate > 3000

    if (isComplexPlanning) {
      return {
        targetTier: 'cloud-reasoner',
        modelId: 'deepseek-reasoner',
        reason: 'Complex architectural reasoning requested; routing to cloud reasoner tier.',
      }
    }

    if (isCodingTask && tokenEstimate < 4000) {
      return {
        targetTier: 'local-fast',
        modelId: this.config.defaultLocalModel ?? 'qwen2.5-coder:14b-instruct',
        reason: 'Coding task within local token threshold; routing to local Ollama instance for zero latency.',
      }
    }

    return {
      targetTier: 'cloud-frontier',
      modelId: this.config.defaultCloudModel ?? 'deepseek-chat',
      reason: 'General inquiry; routing to default cloud frontier endpoint.',
    }
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new ModelRouterService(ctx, config)
  ctx.provide('modelRouter', service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    modelRouter: ModelRouterService
  }
}
