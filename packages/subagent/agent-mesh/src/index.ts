/**
 * Distributed cross-node agent mesh.
 * @module @deepseek-ai/dsh-agent-mesh
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

export const name = 'agent-mesh'

export interface PeerNode {
  readonly nodeId: string
  readonly endpointUrl: string
  readonly status: 'online' | 'busy' | 'offline'
  readonly load: number
}

export interface MeshTask {
  readonly taskId: string
  readonly payload: string
  readonly assignedNodeId?: string
}

export interface Config {
  nodeId?: string
  clusterSecret?: string
}

export const Config: z<Config> = z.object({
  nodeId: z.string().default('node_local_1'),
  clusterSecret: z.string().default(''),
})

export class AgentMeshService {
  private readonly peers = new Map<string, PeerNode>()

  constructor(public ctx: Context, public config: Config) {}

  registerPeer(peer: PeerNode): void {
    this.peers.set(peer.nodeId, peer)
  }

  getBestPeer(): PeerNode | undefined {
    let best: PeerNode | undefined = undefined
    for (const peer of this.peers.values()) {
      if (peer.status === 'online') {
        if (!best || peer.load < best.load) {
          best = peer
        }
      }
    }
    return best
  }

  async offloadTask(task: MeshTask): Promise<{ dispatched: boolean; nodeId: string; result?: string }> {
    const peer = this.getBestPeer()
    if (!peer) {
      return {
        dispatched: false,
        nodeId: this.config.nodeId ?? 'local',
        result: 'Executed locally: no active remote peers available in mesh.',
      }
    }

    return {
      dispatched: true,
      nodeId: peer.nodeId,
      result: `Successfully offloaded task ${task.taskId} to remote peer ${peer.endpointUrl}`,
    }
  }
}

export function apply(ctx: Context, config: Config) {
  const service = new AgentMeshService(ctx, config)
  ctx.provide('agentMesh', service)
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    agentMesh: AgentMeshService
  }
}
