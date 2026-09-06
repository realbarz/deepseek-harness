import { describe, expect, it } from 'vitest'
import { parseSnapshot, queryFor, validateSettings } from '../src/index.ts'
import type { ResolvedHardwareMonitorSettings } from '../src/index.ts'

const base: ResolvedHardwareMonitorSettings = {
  enabled: true,
  intervalMs: 2_000,
  categories: ['cpu', 'memory'],
  sensorNames: [],
}

describe('Windows hardware monitor provider', () => {
  it('includes only selected CIM categories', () => {
    const query = queryFor({ ...base, categories: ['gpu'] })

    expect(query).toContain('Win32_VideoController')
    expect(query).not.toContain('Win32_Processor')
    expect(query).not.toContain('Win32_OperatingSystem')
  })

  it('escapes named sensor selectors for PowerShell literals', () => {
    const query = queryFor({ ...base, categories: ['cpu'], sensorNames: ["CPU's name"] })

    expect(query).toContain("'CPU''s name'")
  })

  it('rejects an empty category selection and oversized selector list', () => {
    expect(() => validateSettings({ ...base, categories: [] })).toThrow(/at least one category/)
    expect(() => validateSettings({ ...base, sensorNames: Array.from({ length: 33 }, () => 'sensor') }))
      .toThrow(/at most 32 sensor names/)
  })

  it('parses a scalar CIM response and omits unselected memory', () => {
    const snapshot = parseSnapshot(JSON.stringify({
      computerName: 'HOST',
      osVersion: '10.0',
      cpu: { Name: 'CPU', LoadPercentage: 42 },
      memory: null,
      gpu: { Name: 'GPU', AdapterRAM: 1024 },
    }))

    expect(snapshot.cpu).toEqual([{ name: 'CPU', loadPercent: 42 }])
    expect(snapshot.memory).toBeUndefined()
    expect(snapshot.gpu).toEqual([{ name: 'GPU', memoryBytes: 1024 }])
  })
})
