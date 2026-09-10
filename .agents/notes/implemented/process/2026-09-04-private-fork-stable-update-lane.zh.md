# Agent Note: 私有 DSH fork 的稳定版上游更新通道

Status: implemented

[English](2026-09-04-private-fork-stable-update-lane.md) | 中文

## Problem

私有 DSH 部署需要持续获取上游应用更新，同时不能把本地部署配置变成上游贡献。直接 pull 不是可靠的操作流程：fork 带有 Windows 与 Ollama 覆盖提交，上游发布 tag 独立推进，生成产物可能过期，而本地 Harness home 状态也不是源代码。

## Decision

私有 fork 将 `upstream` 视为供应方源仓库，将 `origin` 视为可部署产品仓库。每次更新都从明确的稳定 `dsh-vX.Y.Z` tag 开始，在可审查的 `update/upstream-<tag>` 分支上进行。私有覆盖层通过明确、可 cherry-pick 的提交重新应用；运行时 home 与密钥保持未跟踪。

`scripts/update-private-fork.ps1` 在 Windows 上实现这条流程。它获取上游 tag，除非显式允许，否则拒绝预发布 tag，校验覆盖提交，创建集成分支，重新应用覆盖层，运行锁定安装、typecheck 与 build，并可选择推送集成分支。合入私有 `master` 与部署仍然是明确的人工审查步骤。

部署覆盖层通过已跟踪的 launcher 与 patch 文件拥有 Ollama endpoint 和模型选择。每次上游更新后都必须检查生效配置，因为 Cordis patch 会替换完整配置行。遇到持久化格式不确定的发布版本时，默认使用新的 Harness home；不会静默迁移旧会话数据。

## Alternatives considered

**直接把上游拉入可部署分支。** 不采用，因为它把供应方移动、私有配置与发布提升混成一次不可逆操作，也让冲突难以审查。

**自动选择最新 tag。** 不采用，因为预发布版本发布频繁，私有部署应当有意选择已知稳定版本。

**把 Ollama 设置写进上游包代码。** 不采用，因为模型 endpoint 与部署凭据属于机器策略，不属于产品核心行为；覆盖层可以重新应用，而无需维护 fork 的运行时实现。

**未经校验地跨版本复制 Harness home。** 不采用，因为 session、JSONL、SQLite 与 profile 格式可能拒绝不兼容状态；新的 home 或明确迁移更可靠。

## Consequences

fork 更新流程现在可重复、可审计，但每个稳定版本仍需要人工审查覆盖冲突、生效配置输出与部署证据。更新器刻意不自动合入 `master`、创建 fork release tag 或部署。运行时状态保留在本机，因此新的 checkout 需要自己的 Ollama 设置与模型可用性。

## Verification

更新器在不存在的 release 上会拒绝执行且不修改 worktree。当前私有分支已通过仓库 pre-commit 与 pre-push hook、完整 build、生效 Ollama 配置检查，以及连接本地 Ollama 服务的 live web-profile 启动检查。
