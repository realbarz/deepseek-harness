import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import * as daemonPlugin from '../src/index.js'

describe('dsh-daemon-worker', () => {
  it('registers and manages background daemon tasks', async () => {
    const ctx = new Context()
    ctx.plugin(daemonPlugin, { enabled: true, defaultIntervalMs: 10000 })
    await ctx.start()

    const service = ctx.container.get(daemonPlugin.DaemonWorkerService)
    expect(service).toBeDefined()

    let executed = 0
    service.register({
      id: 'test-daemon',
      name: 'Test Daemon',
      intervalMs: 100,
      run: async () => {
        executed++
      },
    })

    await new Promise(resolve => setTimeout(resolve, 250))
    expect(executed).toBeGreaterThan(0)

    service.unregister('test-daemon')
    await ctx.stop()
  })
})
