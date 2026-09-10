# Agent Note: Windows 硬件监控能力接缝

Status: implemented

English | [中文](2026-09-05-windows-hardware-monitor-seam.md)

## Problem

管理本地 Ollama 或 LM Studio 工作负载的 DSH 会话需要当前主机资源信息，但不应让模型解析任意 PowerShell 输出，也不应让工具绑定某一个模型提供方。

## Decision

新增平台无关的 `ctx.hardwareMonitor` 服务及只读 `snapshot()` 操作，并提供通过 `ctx.subprocess` 执行有界 CIM 查询的 Windows 提供方，以及独立的 `hardware_snapshot` 模型工具。标准化结果包含主机标识、CPU 负载、内存总量和图形适配器名称；Windows 未提供的传感器字段省略。

提供方和工具在共享 base bundle 中保持禁用。Windows 部署（例如 Ollama 与 LM Studio 配置）可通过 `hardware-monitor-windows.patch.yml` 启用提供方、工具、Session Remote 流和会话头部 Web 控件。流先发送基线，再发送合并后的替换快照，并在 Remote 订阅结束时停止。控件可以通过 `Agent.inject()` 将一个有界的当前快照明确附加到所选 Session 的下一条提示；不会唤醒空闲 Agent。Ollama 和 LM Studio 仍然是 LLM 路由，不负责主机遥测。

## Alternatives considered

直接使用 `tool-pwsh` 会暴露平台相关的命令输出，使每个消费者重复解析，并允许执行无关命令。扩展 subprocess 的进程表检查器会把进程生命周期观察与物理硬件事实混在一起。

## Consequences

该能力目前仅支持 Windows，并依据 CIM 可用字段工作，不承诺 WMI 可能无法提供的温度读数。查询有明确的超时和输出预算，取消信号会传递给受管理的 subprocess；只有启用可选提供方时，非 Windows 组合才会在加载时失败。原始流快照是临时数据；只有明确附加的快照才进入持久 Session 消息路径。

## Verification

服务、提供方、Session Controller Host/Client、生成的 Remote 合约和 Web 控件已通过聚焦的 TypeScript 检查；提供方解析测试已通过。真实 CIM、硬件、Remote 生命周期和组装 Web 覆盖仍需在 Windows CI 或拥有者机器上补充。
