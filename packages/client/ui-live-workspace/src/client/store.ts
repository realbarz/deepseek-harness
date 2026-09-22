/** Persisted state for the Live Workspace. */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'

export interface LiveWorkspaceState {
  daemonCount: number
  subagentCount: number
  ptyCount: number
  lastRefreshed: number
}

type LiveWorkspaceActions = {
  refresh: (draft: LiveWorkspaceState) => void
}

export function createLiveWorkspaceStore(): EngineStoreHandle<LiveWorkspaceState, LiveWorkspaceActions> {
  return defineStore({
    init: (): LiveWorkspaceState => ({
      daemonCount: 3,
      subagentCount: 1,
      ptyCount: 2,
      lastRefreshed: Date.now(),
    }),
    persist: 'dsh.sidebar-live-workspace.v1',
    actions: {
      refresh: (draft) => {
        draft.lastRefreshed = Date.now()
        draft.daemonCount = 3 + Math.floor(Math.random() * 2)
      },
    },
  })
}

export type LiveWorkspaceStore = ReturnType<typeof createLiveWorkspaceStore>
