import { useMemo, type ReactNode } from 'react'
import {
  IconApiOutline14,
  IconCheckOutline14,
  IconSearchOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import { CAPABILITIES, type CapabilityItem, type DomainId } from '../capabilities-data.ts'
import type { SidebarIntegrationsKey } from '../locales.ts'
import type { IntegrationsStore } from '../store.ts'
import css from './IntegrationsHubTab.module.css'

export type IntegrationsHubTabProps =
  PropsRuntime<'sidebar.right.pane.tab'>
  & PropsStore<IntegrationsStore>
  & PropsLocale<'sidebarIntegrations'>

const DOMAIN_KEYS: readonly (readonly [DomainId, string])[] = [
  ['all', 'domain.all'],
  ['life', 'domain.life'],
  ['commerce', 'domain.commerce'],
  ['finance', 'domain.finance'],
  ['devops', 'domain.devops'],
  ['marketing', 'domain.marketing'],
  ['ai', 'domain.ai'],
  ['creative', 'domain.creative'],
]

export function IntegrationsHubTab({ useStore, actions, t }: IntegrationsHubTabProps): ReactNode {
  const currentDomain = useStore(state => state.domain)
  const searchQuery = useStore(state => state.searchQuery)
  const copiedId = useStore(state => state.copiedId)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return CAPABILITIES.filter((item: CapabilityItem) => {
      if (currentDomain !== 'all' && item.domain !== currentDomain) return false
      if (q === '') return true
      return (
        item.name.toLowerCase().includes(q)
        || item.description.toLowerCase().includes(q)
        || item.tools.some(tool => tool.toLowerCase().includes(q))
      )
    })
  }, [currentDomain, searchQuery])

  const handleCopyPrompt = async (item: CapabilityItem) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(item.samplePrompt)
      }
      actions.setCopiedId(item.id)
      setTimeout(() => {
        actions.setCopiedId(null)
      }, 2500)
    } catch {
      // Fallback if clipboard API is blocked
    }
  }

  return (
    <div className={css.container}>
      <div className={css.header}>
        <div className={css.titleRow}>
          <h2 className={css.title}>{t('type.label')}</h2>
          <span className={css.summaryBadge}>{filteredItems.length} / 140</span>
        </div>
        <div className={css.searchWrapper}>
          <IconSearchOutline16 className={css.searchIcon} />
          <input
            className={css.searchInput}
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onInput={e => actions.setSearchQuery((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div className={css.domainPillRow}>
        {DOMAIN_KEYS.map(([domainId, localeKey]) => {
          const isActive = currentDomain === domainId
          return (
            <button
              key={domainId}
              type="button"
              className={`${css.domainPill} ${isActive ? css.domainPillActive : ''}`}
              onClick={() => actions.setDomain(domainId)}
            >
              {t(localeKey as SidebarIntegrationsKey)}
            </button>
          )
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className={css.emptyState}>{t('empty.noResults')}</div>
      ) : (
        <ul className={css.list}>
          {filteredItems.map((item) => {
            const isCopied = copiedId === item.id
            return (
              <li key={item.id} className={css.card}>
                <div className={css.cardTop}>
                  <h3 className={css.cardTitle}>{item.name}</h3>
                  <span className={css.cardBadge}>{item.domain}</span>
                </div>

                <p className={css.cardDescription}>{item.description}</p>

                <div className={css.toolsRow}>
                  {item.tools.map(tool => (
                    <span key={tool} className={css.toolChip}>{tool}</span>
                  ))}
                </div>

                <div className={css.cardActions}>
                  <div className={css.envIndicator}>
                    {item.envKey ? <span>{item.envKey}</span> : <span>Ready</span>}
                  </div>

                  <button
                    type="button"
                    className={css.triggerBtn}
                    onClick={() => handleCopyPrompt(item)}
                    title={item.samplePrompt}
                  >
                    {isCopied ? (
                      <>
                        <IconCheckOutline14 />
                        <span>{t('action.copied')}</span>
                      </>
                    ) : (
                      <>
                        <IconApiOutline14 />
                        <span>{t('action.runPrompt')}</span>
                      </>
                    )}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
