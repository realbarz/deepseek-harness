import type { ReactNode } from 'react'
import {
  IconRefreshOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { LiveWorkspaceStore } from '../store.ts'
import css from './LiveWorkspaceTab.module.css'

export type LiveWorkspaceTabProps =
  PropsRuntime<'sidebar.right.pane.tab'>
  & PropsStore<LiveWorkspaceStore>
  & PropsLocale<'sidebarLiveWorkspace'>

export function LiveWorkspaceTab({ useStore, actions, t }: LiveWorkspaceTabProps): ReactNode {
  const daemonCount = useStore(state => state.daemonCount)
  const subagentCount = useStore(state => state.subagentCount)
  const ptyCount = useStore(state => state.ptyCount)
  const lastRefreshed = useStore(state => state.lastRefreshed)

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h2 className={css.title}>{t('type.label')}</h2>
        <p className={css.subtitle}>{t('guide.description')}</p>
      </div>

      <div className={css.metricsGrid}>
        <div className={css.metricCard}>
          <span className={css.metricValue}>{daemonCount}</span>
          <span className={css.metricLabel}>{t('metric.daemons')}</span>
        </div>
        <div className={css.metricCard}>
          <span className={css.metricValue}>{subagentCount}</span>
          <span className={css.metricLabel}>{t('metric.subagents')}</span>
        </div>
        <div className={css.metricCard}>
          <span className={css.metricValue}>{ptyCount}</span>
          <span className={css.metricLabel}>{t('metric.pty')}</span>
        </div>
      </div>

      <div className={css.actionsRow}>
        <button
          type="button"
          className={css.btn}
          onClick={() => actions.refresh()}
        >
          <IconRefreshOutline14 />
          <span>{t('action.refresh')}</span>
        </button>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)' }}>
        Last synchronized: {new Date(lastRefreshed).toLocaleTimeString()}
      </div>
    </div>
  )
}
