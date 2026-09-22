/** Static Live Workspace tab type and guide declaration. */
import type { TranslateNS } from '@deepseek-ai/dsh-client-locale/client'
import { IconQueueOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarRightTabDefinition } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from './locales.ts'

export const LIVE_WORKSPACE_KIND = 'live-workspace'
export const LIVE_WORKSPACE_ID = '@deepseek-ai/dsh-client-ui-live-workspace'

export function liveWorkspaceDefinition(t: TranslateNS<'sidebarLiveWorkspace'>): SidebarRightTabDefinition {
  return {
    id: LIVE_WORKSPACE_ID,
    kind: LIVE_WORKSPACE_KIND,
    multiple: false,
    priority: 'builtin',
    title: () => t('type.label'),
    guide: [{
      id: 'live-workspace',
      order: 28,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
      icon: IconQueueOutline14,
    }],
  }
}
