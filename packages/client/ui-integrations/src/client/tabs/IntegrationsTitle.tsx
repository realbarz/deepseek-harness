import type { ReactNode } from 'react'
import { IconApiOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type { IntegrationsStore } from '../store.ts'

export type IntegrationsTitleProps = PropsRuntime<'sidebar.right.pane.tab.title'> & PropsStore<IntegrationsStore>

export function IntegrationsTitle({ useTabInfo }: IntegrationsTitleProps): ReactNode {
  const { tab } = useTabInfo()
  return (
    <>
      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>
        <IconApiOutline14 />
      </span>
      <span>{tab.title}</span>
    </>
  )
}
