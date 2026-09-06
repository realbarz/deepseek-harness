---
description: "Windows CIM provider for host hardware telemetry: CPU load, memory totals, and graphics adapter details."
kind: "package-reference"
---

# @deepseek-ai/dsh-hardware-monitor-windows

English | [中文](README.zh.md)

## Summary

`dsh-hardware-monitor-windows` provides Windows host hardware telemetry for `ctx.hardwareMonitor` by executing bounded CIM/WMI queries through `ctx.subprocess`. It normalizes processor load, physical memory usage, and video adapter information, omitting unavailable sensors without crashing. It supports live sampling intervals with automatic start and stop tied to active subscribers.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this provider on Windows environments when host hardware telemetry is needed. It registers as `ctx.hardwareMonitor` and requires `ctx.subprocess`.

### Minimal configuration

```yaml
- id: hardware-monitor-windows
  name: '@deepseek-ai/dsh-hardware-monitor-windows'
```

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the provider backend delegates model rendering to dsh-tool-hardware-monitor.

#### KV Cache effect

No direct invalidation; the named consumers own any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define when the provider is a poor fit. They are current package constraints, not a task backlog.

- **Windows CIM dependency** — queries rely on PowerShell CIM cmdlets and are restricted to Windows hosts. No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
