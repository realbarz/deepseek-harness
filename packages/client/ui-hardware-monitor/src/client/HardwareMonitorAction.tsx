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

function formatBytesGb(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatRateMb(bytesPerSec: number): string {
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
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
  useEffect(() => () => { controller.stop(sessionId) }, [controller, sessionId])

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

          {/* CPU Section */}
          {snapshot?.cpu.length ? (
            <>
              <div className={css.sectionHeader}>{t('cpu')}</div>
              {snapshot.cpu.map((cpu, i) => (
                <div key={i}>
                  <div className={css.row}>
                    <span>{cpu.name}</span>
                    <span>{cpu.loadPercent === undefined ? t('unavailable') : formatPercent(cpu.loadPercent)}</span>
                  </div>
                  {(cpu.temperatureC !== undefined || cpu.packagePowerW !== undefined
                    || cpu.maxCoreMhz !== undefined || cpu.voltageV !== undefined) ? (
                      <div className={css.subRow}>
                        <span>
                          {[
                            cpu.temperatureC !== undefined ? `${cpu.temperatureC.toFixed(0)}°C` : null,
                            cpu.packagePowerW !== undefined ? `${cpu.packagePowerW.toFixed(1)}W` : null,
                            cpu.maxCoreMhz !== undefined ? `${Math.round(cpu.maxCoreMhz)} MHz` : null,
                            cpu.voltageV !== undefined ? `${cpu.voltageV.toFixed(3)}V` : null,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    ) : null}
                </div>
              ))}
            </>
          ) : null}

          {/* Memory Section */}
          {snapshot?.memory ? (
            <>
              <div className={css.sectionHeader}>{t('memory')}</div>
              <div className={css.row}>
                <span>{t('memory')}</span>
                <span>
                  {`${formatPercent(snapshot.memory.usedPercent)} (${formatBytesGb(snapshot.memory.usedBytes)} / ${formatBytesGb(snapshot.memory.totalBytes)})`}
                </span>
              </div>
              {snapshot.memory.virtualTotalBytes !== undefined && snapshot.memory.virtualAvailableBytes !== undefined ? (
                <div className={css.subRow}>
                  <span>{t('virtualMemory')}</span>
                  <span>
                    {`${formatBytesGb(snapshot.memory.virtualTotalBytes - snapshot.memory.virtualAvailableBytes)} / ${formatBytesGb(snapshot.memory.virtualTotalBytes)}`}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}

          {/* GPU Section */}
          {snapshot?.gpu.length ? (
            <>
              <div className={css.sectionHeader}>{t('gpu')}</div>
              {snapshot.gpu.map((gpu, i) => (
                <div key={i}>
                  <div className={css.row}>
                    <span>{gpu.name}</span>
                    <span>{gpu.loadPercent !== undefined ? formatPercent(gpu.loadPercent) : (gpu.temperatureC !== undefined ? `${gpu.temperatureC.toFixed(0)}°C` : '')}</span>
                  </div>
                  {(gpu.temperatureC !== undefined || gpu.hotSpotC !== undefined
                    || gpu.powerW !== undefined || gpu.fansRpm !== undefined || gpu.memoryBytes !== undefined) ? (
                      <div className={css.subRow}>
                        <span>
                          {[
                            gpu.temperatureC !== undefined ? `${gpu.temperatureC.toFixed(0)}°C` : null,
                            gpu.hotSpotC !== undefined ? `hotspot ${gpu.hotSpotC.toFixed(0)}°C` : null,
                            gpu.powerW !== undefined ? `${gpu.powerW.toFixed(0)}W` : null,
                            gpu.fansRpm && gpu.fansRpm.length > 0 ? gpu.fansRpm.map(rpm => `${Math.round(rpm)} RPM`).join(' / ') : null,
                            gpu.memoryBytes !== undefined ? `${formatBytesGb(gpu.memoryBytes)} VRAM` : null,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    ) : null}
                </div>
              ))}
            </>
          ) : null}

          {/* Disks Section */}
          {snapshot?.disks && snapshot.disks.length > 0 ? (
            <>
              <div className={css.sectionHeader}>{t('disks')}</div>
              {snapshot.disks.map((disk, i) => (
                <div key={i} className={css.diskItem}>
                  <div className={css.row}>
                    <span>{disk.name}</span>
                    <span>
                      {[
                        disk.temperatureC !== undefined ? `${disk.temperatureC.toFixed(0)}°C` : null,
                        disk.activityPercent !== undefined ? `${formatPercent(disk.activityPercent)} ${t('activity')}` : null,
                      ].filter(Boolean).join(' · ') || t('unavailable')}
                    </span>
                  </div>
                  {(disk.readBytesPerSec !== undefined || disk.writeBytesPerSec !== undefined) ? (
                    <div className={css.subRow}>
                      <span>{t('readWrite')}</span>
                      <span>
                        {[
                          disk.readBytesPerSec !== undefined ? `↓ ${formatRateMb(disk.readBytesPerSec)}` : null,
                          disk.writeBytesPerSec !== undefined ? `↑ ${formatRateMb(disk.writeBytesPerSec)}` : null,
                        ].filter(Boolean).join('  ')}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </>
          ) : null}

          {snapshot ? <div className={css.updated}>{t('updated', { seconds: ageSeconds(snapshot) })}</div> : null}
          <div className={css.actions}>
            <button type="button" className={css.control} onClick={() => { controller.stop(sessionId); setOpen(false) }}>
              {t('stop')}
            </button>
            <button type="button" className={css.control} onClick={() => { void controller.attachNextPrompt(sessionId) }}>
              {t('attach')}
            </button>
          </div>
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
