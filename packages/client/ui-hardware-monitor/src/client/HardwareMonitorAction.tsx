import { useEffect, useState } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { HardwareSnapshot } from '@deepseek-ai/dsh-hardware-monitor'
import { NS, type HardwareMonitorKey } from './locales.ts'
import type { HardwareMonitorController, HardwareMonitorView } from './controller.ts'
import css from './HardwareMonitorAction.module.css'

export interface HardwareMonitorFace {
  controller: HardwareMonitorController
}

type Props = PropsRuntime<'conversation.session.header.actions'>
  & PropsLocale<typeof NS>
  & InjectFace<HardwareMonitorFace>

function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

function ageSeconds(snapshot: HardwareSnapshot | undefined): number {
  return snapshot === undefined ? 0 : Math.max(0, Math.floor((Date.now() - snapshot.capturedAt) / 1_000))
}

function statusText(view: HardwareMonitorView, t: Props['t']): string {
  switch (view.status) {
    case 'live': return t('live')
    case 'connecting': return t('connecting')
    case 'error': return t('error')
    case 'stopped': return t('stopped')
  }
}

/** Session-header control for the live hardware-monitor channel. */
export function HardwareMonitorAction({ sessionId, t, controller }: Props) {
  const [, redraw] = useState(0)
  const [open, setOpen] = useState(false)
  const view = controller.get(sessionId)
  const snapshot = view.snapshot

  useEffect(() => controller.subscribe(() => { redraw(value => value + 1) }), [controller])
  useEffect(() => () => { void controller.stop(sessionId) }, [controller, sessionId])

  return (
    <div className={css.root}>
      <button
        type="button"
        className={css.trigger}
        aria-expanded={open}
        onClick={() => {
          setOpen(value => !value)
          if (view.status === 'stopped' || view.status === 'error') controller.start(sessionId)
        }}
      >
        <span className={css.dot} data-status={view.status} />
        {t('action')}
      </button>
      {open ? (
        <div className={css.panel} role="status">
          <div className={css.heading}>
            <span>{t('status')}</span>
            <span>{statusText(view, t)}</span>
          </div>
          {view.error ? <div className={css.error}>{view.error}</div> : null}
          {snapshot?.cpu.length ? (
            <div className={css.row}><span>{t('cpu')}</span><span>{snapshot.cpu.map(item => `${item.name}: ${item.loadPercent === undefined ? t('unavailable') : formatPercent(item.loadPercent)}`).join(', ')}</span></div>
          ) : null}
          {snapshot?.memory ? (
            <div className={css.row}><span>{t('memory')}</span><span>{formatPercent(snapshot.memory.usedPercent)}</span></div>
          ) : null}
          {snapshot?.gpu.length ? (
            <div className={css.row}><span>{t('gpu')}</span><span>{snapshot.gpu.map(item => item.name).join(', ')}</span></div>
          ) : null}
          {snapshot ? <div className={css.updated}>{t('updated', { seconds: ageSeconds(snapshot) })}</div> : null}
          <button type="button" className={css.control} onClick={() => { void controller.stop(sessionId); setOpen(false) }}>
            {t('stop')}
          </button>
          <button type="button" className={css.control} onClick={() => { void controller.attachNextPrompt(sessionId) }}>
            {t('attach')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    hardwareMonitor: HardwareMonitorKey
  }
}
