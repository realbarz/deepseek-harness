/** Register the Live Workspace tab type in the right Sidebar. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { LiveWorkspaceTab } from './tabs/LiveWorkspaceTab.tsx'
import { LIVE_WORKSPACE_ID, liveWorkspaceDefinition } from './definition.tsx'
import { en, zh } from './locales.ts'
import { createLiveWorkspaceStore } from './store.ts'

export type { LiveWorkspaceTabProps } from './tabs/LiveWorkspaceTab.tsx'
export type { SidebarLiveWorkspaceKey } from './locales.ts'
export type { LiveWorkspaceState } from './store.ts'

export const inject = ['slots', 'locale', 'sidebarRightTabs']

export function apply(ctx: Context): void {
  const namespace = 'sidebarLiveWorkspace'
  const t = ctx.locale.bind(namespace)
  const store = createLiveWorkspaceStore()

  ctx.effect(() => ctx.locale.register(namespace, { zh, en }), 'ui-live-workspace.copy')
  ctx.effect(() => ctx.sidebarRightTabs.register(liveWorkspaceDefinition(t)), 'ui-live-workspace.type')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: LIVE_WORKSPACE_ID,
    locale: namespace,
    store,
  }, LiveWorkspaceTab)), 'ui-live-workspace.body')
}
