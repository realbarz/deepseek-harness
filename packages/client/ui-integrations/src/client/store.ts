/** Persisted state for the Integrations Hub. */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import type { DomainId } from './capabilities-data.ts'

export interface IntegrationsHubState {
  domain: DomainId
  searchQuery: string
  copiedId: string | null
}

type IntegrationsHubActions = {
  setDomain: (draft: IntegrationsHubState, domain: DomainId) => void
  setSearchQuery: (draft: IntegrationsHubState, query: string) => void
  setCopiedId: (draft: IntegrationsHubState, id: string | null) => void
}

/** Declare the session-scoped Integrations Hub store. */
export function createIntegrationsStore(): EngineStoreHandle<IntegrationsHubState, IntegrationsHubActions> {
  return defineStore({
    init: (): IntegrationsHubState => ({
      domain: 'all',
      searchQuery: '',
      copiedId: null,
    }),
    persist: 'dsh.sidebar-integrations.v1',
    actions: {
      setDomain: (draft, domain: DomainId) => {
        draft.domain = domain
      },
      setSearchQuery: (draft, query: string) => {
        draft.searchQuery = query
      },
      setCopiedId: (draft, id: string | null) => {
        draft.copiedId = id
      },
    },
  })
}

export type IntegrationsStore = ReturnType<typeof createIntegrationsStore>
