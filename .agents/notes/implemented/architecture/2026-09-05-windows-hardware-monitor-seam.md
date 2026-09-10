# Agent Note: Windows hardware monitor capability seam

Status: implemented

English | [中文](2026-09-05-windows-hardware-monitor-seam.zh.md)

## Problem

DSH sessions that manage local Ollama or LM Studio workloads need current host resource facts without making the model parse arbitrary PowerShell output or coupling the tool to one model provider.

## Decision

Add a platform-neutral `ctx.hardwareMonitor` service with a read-only `snapshot()` operation, a Windows provider that executes bounded CIM queries through `ctx.subprocess`, and a separate `hardware_snapshot` model-facing tool. The normalized result covers host identity, CPU load, memory totals, and graphics adapter names and memory when Windows exposes them; unavailable sensors are omitted.

The provider and tool are disabled in the shared base bundle. `hardware-monitor-windows.patch.yml` enables the provider, tool, Session Remote stream, and session-header Web widget for a Windows deployment such as the Ollama and LM Studio setup. The stream sends a baseline followed by coalesced replacement snapshots and stops when its Remote subscription ends. The widget can explicitly attach one bounded current snapshot to the selected Session's next prompt through `Agent.inject()`; it does not wake idle agents. Ollama and LM Studio remain LLM routes; they do not own host telemetry.

## Alternatives considered

Using `tool-pwsh` would expose a platform-specific transcript, duplicate parsing in every consumer, and permit unrelated command execution. Extending the subprocess process-table inspector would mix process-lifecycle observations with physical hardware facts.

## Consequences

The capability is currently Windows-only and uses CIM availability rather than promising temperature readings that WMI may not provide. Queries have explicit timeout and output budgets, cancellation is forwarded to the managed subprocess, and non-Windows composition fails only when the opt-in provider is enabled. Raw stream samples are transient; only an explicitly attached snapshot enters the durable session message path.

## Verification

The service, provider, Session Controller Host/Client faces, generated Remote contract, and Web widget pass focused TypeScript checks; provider parsing tests pass. Runtime CIM, real hardware, Remote lifecycle, and assembled Web coverage remain to be added on a Windows CI or owner machine.
