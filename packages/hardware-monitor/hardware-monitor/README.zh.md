---
description: "DeepSeek Harness 硬件遥测服务定义：规范化的主机快照与订阅生命周期。"
kind: "package-reference"
---

# @deepseek-ai/dsh-hardware-monitor

[English](README.md) | 中文

## 概述

`dsh-hardware-monitor` 是 DeepSeek Harness 主机物理遥测的服务定义。它定义了抽象的 `HardwareMonitor` 服务、覆盖 CPU、内存和 GPU 遥测的规范化 `HardwareSnapshot` 结构，以及有界实时采样的订阅契约。组合将此服务与平台提供者（如 `dsh-hardware-monitor-windows`）以及使用者（如 `dsh-tool-hardware-monitor` 或 `dsh-client-ui-hardware-monitor`）配对。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

通过提供者或使用者加载此包契约；服务定义本身注册 `ctx.hardwareMonitor`。提供者实现时间点快照和实时采样订阅，而使用者访问规范化快照而无需查询平台特定 API。

### Minimal configuration

本包为服务契约，不包含独立配置。组合提供者以实现该接缝：

```yaml
- name: '@deepseek-ai/dsh-hardware-monitor-windows'
- name: '@deepseek-ai/dsh-tool-hardware-monitor'
```

-----

<a id="model-experience"></a>
## 模型体验

Indirectly, through the service interface delegates model rendering to dsh-tool-hardware-monitor.

#### KV Cache 影响

No direct invalidation; the named consumers own any request-prefix changes.

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

These limits define when the contract is a poor fit. They are current package constraints, not a task backlog.

- **仅抽象契约** — 必须在组合中加载平台提供者以实现 `ctx.hardwareMonitor`。No runtime invariant companion is published because independent observations cannot diverge.

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
