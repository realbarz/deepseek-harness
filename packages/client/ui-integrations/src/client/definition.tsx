/** Static Integrations tab type and guide declaration. */
import type { TranslateNS } from '@deepseek-ai/dsh-client-locale/client'
import { IconApiOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarRightTabDefinition } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from './locales.ts'

/** Integrations tab kind. */
export const INTEGRATIONS_KIND = 'integrations'

/** Integrations implementation identity and keyed Slot dispatch key. */
export const INTEGRATIONS_ID = '@deepseek-ai/dsh-client-ui-integrations'

/** Build the Integrations tab type with locale-live copy. */
export function integrationsDefinition(t: TranslateNS<'sidebarIntegrations'>): SidebarRightTabDefinition {
  return {
    id: INTEGRATIONS_ID,
    kind: INTEGRATIONS_KIND,
    multiple: false,
    priority: 'builtin',
    title: () => t('type.label'),
    guide: [{
      id: 'integrations-hub',
      order: 25,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
      icon: IconApiOutline14,
    }],
  }
}
