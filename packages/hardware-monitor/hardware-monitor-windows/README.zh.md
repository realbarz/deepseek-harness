---
description: "用于主机硬件遥测的 Windows CIM 提供者：CPU 负载、内存总量与显卡详情。"
kind: "package-reference"
---

# @deepseek-ai/dsh-hardware-monitor-windows

[English](README.md) | 中文

## 概述

`dsh-hardware-monitor-windows` 通过 `ctx.subprocess` 执行有界 CIM/WMI 查询，为 `ctx.hardwareMonitor` 提供 Windows 主机硬件遥测。它规范化处理器负载、物理内存使用率以及视频适配器信息，在不崩溃的情况下忽略不可用传感器。它支持实时采样间隔，并根据活跃订阅者自动启停。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在需要主机硬件遥测的 Windows 环境中挂载此提供者。它注册为 `ctx.hardwareMonitor` 并依赖 `ctx.subprocess`。

### Minimal configuration

```yaml
- id: hardware-monitor-windows
  name: '@deepseek-ai/dsh-hardware-monitor-windows'
```

-----

<a id="model-experience"></a>
## 模型体验

Indirectly, through the provider backend delegates model rendering to dsh-tool-hardware-monitor.

#### KV Cache 影响

No direct invalidation; the named consumers own any request-prefix changes.

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

These limits define when the provider is a poor fit. They are current package constraints, not a task backlog.

- **Windows CIM 依赖** — 查询依赖 PowerShell CIM cmdlet，仅限于 Windows 主机。No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
