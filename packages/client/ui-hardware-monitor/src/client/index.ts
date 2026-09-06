import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import { HardwareMonitorAction } from './HardwareMonitorAction.tsx'
import { HardwareMonitorController } from './controller.ts'
import { en, NS, zh } from './locales.ts'

export const inject = ['sessions', 'slots', 'locale', 'remote', 'remote.session']

/** Mount the session-header live hardware-monitor action. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'ui-hardware-monitor: dictionaries')
  const controller = new HardwareMonitorController(ctx)
  ctx.effect(() => () => { void controller.dispose() }, 'ui-hardware-monitor: controller')
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'hardware-monitor',
    order: 25,
    locale: NS,
    inject: () => ({ controller }),
  }, HardwareMonitorAction))
}

export type { HardwareMonitorFace } from './HardwareMonitorAction.tsx'
export type { HardwareMonitorView } from './controller.ts'
