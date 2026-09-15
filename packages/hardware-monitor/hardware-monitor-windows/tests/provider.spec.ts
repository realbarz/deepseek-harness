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

  it('includes disk CIM and PDH blocks when disk category is selected', () => {
    const query = queryFor({ ...base, categories: ['disk'] })

    expect(query).toContain('Win32_DiskDrive')
    expect(query).toContain('PhysicalDisk')
    expect(query).toContain('$hasDisk = $true')
  })

  it('excludes disk blocks when disk category is not selected', () => {
    const query = queryFor({ ...base, categories: ['cpu', 'memory'] })

    expect(query).toContain('$hasDisk = $false')
    expect(query).not.toContain('Win32_DiskDrive')
  })

  it('includes OHM sensor block in all category combinations', () => {
    const query = queryFor(base)

    expect(query).toContain('root\\OpenHardwareMonitor')
    expect(query).toContain('-ErrorAction Stop')
  })

  it('escapes named sensor selectors for PowerShell literals', () => {
    const query = queryFor({ ...base, categories: ['cpu'], sensorNames: ["CPU's name"] })

    expect(query).toContain("'CPU''s name'")
  })

  it('rejects an empty category selection and oversized selector list', () => {
    expect(() => { validateSettings({ ...base, categories: [] }) }).toThrow(/at least one category/)
    expect(() => { validateSettings({ ...base, sensorNames: Array.from({ length: 33 }, () => 'sensor') }) })
      .toThrow(/at most 32 sensor names/)
  })

  it('parses a scalar CIM response with no OHM data and omits unselected memory', () => {
    const snapshot = parseSnapshot(JSON.stringify({
      computerName: 'HOST',
      osVersion: '10.0',
      cpu: { name: 'CPU', loadPercent: 42, maxCoreMhz: 3000, coreLoadPercents: null, temperatureC: null },
      memory: null,
      gpu: { name: 'GPU', memoryBytes: 1024, loadPercent: null, temperatureC: null, fansRpm: null },
      disk: null,
    }))

    expect(snapshot.cpu).toEqual([{ name: 'CPU', loadPercent: 42, maxCoreMhz: 3000 }])
    expect(snapshot.memory).toBeUndefined()
    expect(snapshot.gpu).toEqual([{ name: 'GPU', memoryBytes: 1024 }])
    expect(snapshot.disks).toBeUndefined()
  })

  it('parses OHM sensor fields when present', () => {
    const snapshot = parseSnapshot(JSON.stringify({
      computerName: 'HOST',
      osVersion: '10.0',
      cpu: [{
        name: 'Intel Xeon',
        loadPercent: 10,
        coreLoadPercents: [5, 15, 8, 12],
        temperatureC: 47,
        coreTemperaturesC: [45, 48, 46, 47],
        packagePowerW: 50.86,
        maxCoreMhz: 2792,
        bclkMhz: 99.7,
        voltageV: 0.959,
      }],
      memory: { totalBytes: 51200000000, availableBytes: 20480000000, virtualTotalBytes: 60000000000, virtualAvailableBytes: 25000000000 },
      gpu: [{
        name: 'NVIDIA GeForce RTX 3080',
        memoryBytes: 10737418240,
        loadPercent: 0,
        temperatureC: 55.8,
        hotSpotC: 66,
        memoryTemperatureC: 62,
        powerW: 25,
        voltageV: 0.719,
        coreMhz: 210,
        memoryMhz: 405,
        fansRpm: [0, 0],
      }],
      disk: [{
        name: 'CT1000MX500SSD1',
        temperatureC: 38,
        activityPercent: 0,
        readBytesPerSec: 0,
        writeBytesPerSec: 0,
      }],
    }))

    expect(snapshot.cpu[0]).toMatchObject({
      name: 'Intel Xeon',
      loadPercent: 10,
      temperatureC: 47,
      packagePowerW: 50.86,
      voltageV: 0.959,
    })
    expect(snapshot.cpu[0]!.coreLoadPercents).toHaveLength(4)
    expect(snapshot.cpu[0]!.coreTemperaturesC).toHaveLength(4)
    expect(snapshot.memory).toBeDefined()
    expect(snapshot.memory!.virtualTotalBytes).toBeDefined()
    expect(snapshot.gpu[0]).toMatchObject({
      name: 'NVIDIA GeForce RTX 3080',
      loadPercent: 0,
      temperatureC: 55.8,
      hotSpotC: 66,
      memoryTemperatureC: 62,
      fansRpm: [0, 0],
    })
    expect(snapshot.disks).toHaveLength(1)
    expect(snapshot.disks![0]!.name).toBe('CT1000MX500SSD1')
    expect(snapshot.disks![0]!.temperatureC).toBe(38)
  })

  it('omits null OHM fields gracefully', () => {
    const snapshot = parseSnapshot(JSON.stringify({
      cpu: [{ name: 'CPU', loadPercent: 6, temperatureC: null, packagePowerW: null, voltageV: null }],
      memory: null,
      gpu: [{ name: 'GPU', memoryBytes: 10737418240, loadPercent: null, temperatureC: null, fansRpm: null }],
      disk: null,
    }))

    expect(snapshot.cpu[0]).toEqual({ name: 'CPU', loadPercent: 6 })
    expect(snapshot.gpu[0]).toEqual({ name: 'GPU', memoryBytes: 10737418240 })
    expect(snapshot.disks).toBeUndefined()
  })
})
