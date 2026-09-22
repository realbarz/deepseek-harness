/** Register the Integrations Hub tab type in the right Sidebar. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { IntegrationsHubTab } from './tabs/IntegrationsHubTab.tsx'
import { IntegrationsTitle } from './tabs/IntegrationsTitle.tsx'
import { INTEGRATIONS_ID, integrationsDefinition } from './definition.tsx'
import { en, zh } from './locales.ts'
import { createIntegrationsStore } from './store.ts'

export type { IntegrationsHubTabProps } from './tabs/IntegrationsHubTab.tsx'
export type { IntegrationsTitleProps } from './tabs/IntegrationsTitle.tsx'
export type { SidebarIntegrationsKey } from './locales.ts'
export type { IntegrationsHubState } from './store.ts'

/** Required Browser services. */
export const inject = ['slots', 'locale', 'sidebarRightTabs']

/** Register the Integrations Hub type, localized guide entry, body, and title. */
export function apply(ctx: Context): void {
  const namespace = 'sidebarIntegrations'
  const t = ctx.locale.bind(namespace)
  const store = createIntegrationsStore()

  ctx.effect(() => ctx.locale.register(namespace, { zh, en }), 'ui-integrations.copy')
  ctx.effect(() => ctx.sidebarRightTabs.register(integrationsDefinition(t)), 'ui-integrations.type')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: INTEGRATIONS_ID,
    locale: namespace,
    store,
  }, IntegrationsHubTab)), 'ui-integrations.body')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab.title',
    key: INTEGRATIONS_ID,
    store,
  }, IntegrationsTitle)), 'ui-integrations.title')
}
