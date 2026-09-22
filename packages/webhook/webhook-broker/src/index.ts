/**
 * Zero-config webhook and event ingress broker.
 * @module @deepseek-ai/dsh-webhook-broker
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import crypto from 'node:crypto'

export const name = 'webhook-broker'

export interface WebhookPayload {
  readonly provider: 'github' | 'stripe' | 'pagerduty' | 'custom'
  readonly eventType: string
  readonly rawBody: string
  readonly signature?: string
}

export interface WebhookResult {
  readonly success: boolean
  readonly eventId: string
  readonly dispatchedToSession?: string
}

export interface Config {
  secretToken?: string
}

export const Config: z<Config> = z.object({
  secretToken: z.string().default(''),
})

export class WebhookBrokerService {
  constructor(public ctx: Context, public config: Config) {}

  verifySignature(payload: string, signature: string | undefined): boolean {
    if (!this.config.secretToken) return true
    if (!signature) return false

    const expected = crypto
      .createHmac('sha256', this.config.secretToken)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  }

  async handleIngress(payload: WebhookPayload): Promise<WebhookResult> {
    const valid = this.verifySignature(payload.rawBody, payload.signature)
    if (!valid) {
      throw new Error('WebhookBroker: invalid cryptographic signature')
    }

    const eventId = `wh_${Math.random().toString(36).slice(2, 9)}`

    // Emit Cordis event for automated background reactions
    ;(this.ctx.emit as (name: string, payload: unknown) => void)('webhook/ingress', {
      eventId,
      provider: payload.provider,
      eventType: payload.eventType,
    })

    return {
      success: true,
      eventId,
      dispatchedToSession: 'session_active',
    }
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new WebhookBrokerService(ctx, config)
  ctx.provide('webhookBroker', service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    webhookBroker: WebhookBrokerService
  }
}
