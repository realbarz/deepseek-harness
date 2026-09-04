# Agent Note: Stable upstream updates for a private DSH fork

Status: implemented

English | [中文](2026-09-04-private-fork-stable-update-lane.zh.md)

## Problem

A private DSH deployment needs upstream application updates without turning local deployment configuration into an upstream contribution. A direct pull is unsafe as an operating procedure: the fork carries Windows and Ollama overlay commits, upstream release tags advance independently, generated artifacts can become stale, and local Harness-home state is not source code.

## Decision

The private fork treats `upstream` as the vendor source and `origin` as the deployable product repository. Each update starts from an explicit stable `dsh-vX.Y.Z` tag on a reviewable `update/upstream-<tag>` branch. The private overlay is reapplied as explicit cherry-pickable commits; runtime homes and secrets remain untracked.

`scripts/update-private-fork.ps1` implements this workflow on Windows. It fetches upstream tags, rejects prerelease tags unless explicitly enabled, verifies overlay commits, creates the integration branch, reapplies the overlay, runs locked installation, typecheck, and build, and optionally pushes the integration branch. Promotion to private `master` and deployment remain deliberate review steps.

The deployment overlay owns the Ollama endpoint and model selection through the tracked launcher and patch files. The effective configuration must be inspected after every upstream update because Cordis patches replace complete configuration rows. A fresh Harness home is the default after a release with persistence-format uncertainty; existing session data is not silently migrated.

## Alternatives considered

**Pulling upstream directly into the deployable branch.** Rejected because it mixes vendor movement, private configuration, and release promotion into one irreversible operation and makes conflicts harder to review.

**Automatically selecting the newest tag.** Rejected because prereleases are published frequently and a private deployment should choose a known stable release deliberately.

**Embedding Ollama settings in upstream package code.** Rejected because model endpoints and deployment credentials are machine policy, not product-core behavior; the overlay can be reapplied without carrying a forked runtime implementation.

**Copying the Harness home across releases without validation.** Rejected because session, JSONL, SQLite, and profile formats can reject incompatible state; a clean home or an explicit migration is safer.

## Consequences

The fork update path is repeatable and auditable, but each stable release still requires a human review of overlay conflicts, configuration output, and deployment evidence. The updater intentionally does not merge into `master`, create a fork release tag, or deploy automatically. Runtime state remains local to the machine, so a new checkout needs its own Ollama settings and model availability.

## Verification

The updater rejects a nonexistent release without modifying the worktree. The current private branch has passed the repository pre-commit and pre-push hooks, the full build, effective Ollama configuration inspection, and live web-profile startup against the local Ollama service.
