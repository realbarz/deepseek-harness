/** Locale-owned Live Workspace copy. */
export const zh = {
  'type.label': '实时工作台',
  'guide.title': '实时工作台',
  'guide.description': '监控后台守护进行、管理活动会话并实时检查后端 RPC 状态',
  'metric.daemons': '活跃守护进程',
  'metric.subagents': '子代理并发',
  'metric.pty': '活动终端 PTY',
  'action.refresh': '刷新遥测状态',
  'action.spawnWorker': '启动守护 Worker',
  'header.telemetry': '系统遥测与监控',
} satisfies Record<string, string>

export type SidebarLiveWorkspaceKey = keyof typeof zh

export const en = {
  'type.label': 'Live Workspace',
  'guide.title': 'Live Workspace',
  'guide.description': 'Monitor background daemons, active subagents, and inspect backend RPC states in real time',
  'metric.daemons': 'Active Daemons',
  'metric.subagents': 'Active Subagents',
  'metric.pty': 'Active Terminals',
  'action.refresh': 'Refresh Telemetry',
  'action.spawnWorker': 'Spawn Worker',
  'header.telemetry': 'System Telemetry & Monitoring',
} satisfies Record<SidebarLiveWorkspaceKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Live Workspace copy namespace. */
    sidebarLiveWorkspace: SidebarLiveWorkspaceKey
  }
}
