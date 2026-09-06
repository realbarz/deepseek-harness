---
description: "The hardware telemetry service definition for DeepSeek Harness: normalized host snapshots and subscription lifecycles."
kind: "package-reference"
---

# @deepseek-ai/dsh-hardware-monitor

English | [中文](README.zh.md)

## Summary

`dsh-hardware-monitor` is the service definition for host physical telemetry in DeepSeek Harness. It defines the abstract `HardwareMonitor` service, normalized `HardwareSnapshot` structures covering CPU, memory, and GPU telemetry, and the subscription contract for bounded live sampling. Compositions pair this service with a platform provider such as `dsh-hardware-monitor-windows` and consumers such as `dsh-tool-hardware-monitor` or `dsh-client-ui-hardware-monitor`.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Load this package contract through a provider or consumer; the service definition itself registers `ctx.hardwareMonitor`. Providers implement point-in-time snapshots and live sampling subscriptions, while consumers access normalized snapshots without querying platform-specific APIs.

### Minimal configuration

This package is a service contract and carries no standalone configuration. Compose a provider to fulfill the seam:

```yaml
- name: '@deepseek-ai/dsh-hardware-monitor-windows'
- name: '@deepseek-ai/dsh-tool-hardware-monitor'
```

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the service interface delegates model rendering to dsh-tool-hardware-monitor.

#### KV Cache effect

No direct invalidation; the named consumers own any request-prefix changes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define when the contract is a poor fit. They are current package constraints, not a task backlog.

- **Abstract contract only** — a platform provider must be loaded in the composition to fulfill `ctx.hardwareMonitor`. No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
