---
description: "面向模型的 hardware_snapshot 工具：当前主机 CPU、内存与显卡遥测数据。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-hardware-monitor

[English](README.md) | 中文

## 概述

`dsh-tool-hardware-monitor` 为智能体提供 `hardware_snapshot` 工具，允许模型检查当前主机资源使用情况，包括 CPU 负载、内存利用率和图形适配器状态。缺失的传感器将被忽略；数值代表单次时间点快照。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在智能体需要时间点主机硬件事实的组合中挂载此插件。它依赖 `ctx.tools` 和 `ctx.hardwareMonitor`。

### Minimal configuration

```yaml
- id: tool-hardware-monitor
  name: '@deepseek-ai/dsh-tool-hardware-monitor'
```

-----

<a id="model-experience"></a>
## 模型体验

### 工具模式

#### 模型可见内容

此工具在会话中可见时生成的 [`hardware_snapshot` 模式](../../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-hardware-monitor)。

#### Token 影响

工具可见的每个请求上的固定模式开销。

#### KV Cache 影响

工具定义未更改时保持前缀稳定。

### 结果

#### 模型可见内容

包含主机标识、CPU 负载百分比、内存字节和 GPU 适配器事实的单个 JSON 对象。

#### Token 影响

受规范化硬件快照大小限制；数值保留在轮次历史中直至压缩。

#### KV Cache 影响

仅追加；新可见内容跟随请求前缀，不会使现有 KV 缓存条目失效。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

These limits define when the tool is a poor fit. They are current package constraints, not a task backlog.

- **单次快照** — 工具返回时间点快照，不会向模型上下文中流式传输连续更新。No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
