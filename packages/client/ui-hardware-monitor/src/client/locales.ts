/** Localized copy for the live hardware-monitor header action. */
export const NS = 'hardwareMonitor'

export const zh = {
  action: '硬件监控',
  status: '状态',
  live: '实时',
  connecting: '连接中',
  error: '错误',
  stopped: '已停止',
  start: '开始',
  stop: '停止',
  attach: '附加到下一条提示',
  attached: '已附加',
  unavailable: '不可用',
  memory: '内存',
  cpu: '处理器',
  gpu: '显卡',
  updated: '更新于 {seconds} 秒前',
} as const

export const en: Record<HardwareMonitorKey, string> = {
  action: 'Hardware monitor',
  status: 'Status',
  live: 'live',
  connecting: 'connecting',
  error: 'error',
  stopped: 'stopped',
  start: 'start',
  stop: 'stop',
  attach: 'attach to next prompt',
  attached: 'attached',
  unavailable: 'unavailable',
  memory: 'memory',
  cpu: 'CPU',
  gpu: 'GPU',
  updated: 'updated {seconds}s ago',
}

export type HardwareMonitorKey = keyof typeof zh
