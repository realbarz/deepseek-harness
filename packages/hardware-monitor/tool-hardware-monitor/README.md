---
description: "Model-facing hardware_snapshot tool: current host CPU, memory, and graphics adapter telemetry."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-hardware-monitor

English | [中文](README.zh.md)

## Summary

`dsh-tool-hardware-monitor` provides the agent with the `hardware_snapshot` tool, allowing models to inspect current host resource usage including CPU load, memory utilization, and graphics adapter status. Missing sensors are omitted; values represent a single point-in-time snapshot.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin in compositions where the agent needs point-in-time host hardware facts. It requires `ctx.tools` and `ctx.hardwareMonitor`.

### Minimal configuration

```yaml
- id: tool-hardware-monitor
  name: '@deepseek-ai/dsh-tool-hardware-monitor'
```

-----

<a id="model-experience"></a>
## Model Experience

### Tool schemas

#### What the model sees

The generated [`hardware_snapshot` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-hardware-monitor) while this tool is visible in the session.

#### Token effect

Fixed schema cost on each request where the tool is visible.

#### KV Cache effect

Prefix-stable while tool definitions are unchanged.

### Results

#### What the model sees

A single JSON object with host identity, CPU load percentages, memory bytes, and GPU adapter facts.

#### Token effect

Bounded by the normalized hardware snapshot size; values persist in turn history until compaction.

#### KV Cache effect

Append-only; newly visible content follows the request prefix and does not invalidate existing KV cache entries.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define when the tool is a poor fit. They are current package constraints, not a task backlog.

- **One-shot snapshot** — the tool returns a point-in-time snapshot and does not stream continuous updates into the model context. No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
