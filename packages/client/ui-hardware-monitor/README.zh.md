---
description: "用于 DeepSeek Harness Web GUI 的会话头部实时硬件监控部件。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-hardware-monitor

[English](README.md) | 中文

## 概述

`dsh-client-ui-hardware-monitor` 向 Web GUI 的会话头部贡献实时硬件监控动作。它可视化来自主机流的实时 CPU、内存和 GPU 遥测，并允许用户显式将当前指标附加到下一条模型提示词中。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在启用了实时硬件遥测的 Web 组合中加载此客户端插件。

### Minimal configuration

```yaml
- id: ui-hardware-monitor
  name: '@deepseek-ai/dsh-client-ui-hardware-monitor'
```

-----

<a id="model-experience"></a>
## 模型体验

None, as this package renders live host telemetry for a human and touches no prompt, message, schema, stream, or tool result.

#### KV Cache 影响

No direct invalidation; this package contributes no model-visible tokens.

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

These limits define when the package is a poor fit. They are current package constraints, not a task backlog.

- **仅客户端展示** — 依赖主机端 `hardwareMonitorStream` 的可用性。No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
