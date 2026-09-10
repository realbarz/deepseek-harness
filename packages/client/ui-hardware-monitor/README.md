---
description: "Session-header live hardware monitor widget for DeepSeek Harness Web UI."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-hardware-monitor

English | [中文](README.zh.md)

## Summary

`dsh-client-ui-hardware-monitor` contributes a live hardware monitoring action to the session header in the Web UI. It visualizes real-time CPU, memory, and GPU telemetry from the host stream and allows users to explicitly attach current metrics to the next model prompt.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Load this client plugin in Web compositions where real-time hardware telemetry is enabled.

### Minimal configuration

```yaml
- id: ui-hardware-monitor
  name: '@deepseek-ai/dsh-client-ui-hardware-monitor'
```

-----

<a id="model-experience"></a>
## Model Experience

None, as this package renders live host telemetry for a human and touches no prompt, message, schema, stream, or tool result.

#### KV Cache effect

No direct invalidation; this package contributes no model-visible tokens.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define when the package is a poor fit. They are current package constraints, not a task backlog.

- **Client presentation only** — relies on host-side `hardwareMonitorStream` availability. No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
