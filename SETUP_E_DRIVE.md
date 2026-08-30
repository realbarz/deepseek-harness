# DeepSeek Harness Setup on Secondary Drive (E:/)

**Date**: 2026-08-30
**Environment**: Windows 10 Runtime with Secondary Hard Drive
**Objective**: Portable DSH deployment foundation ready for cross-platform distribution (Windows, macOS, Linux)

---

## Overview

This document captures the effort to establish DeepSeek Harness (DSH) on a dedicated secondary drive (E:/) on Windows 10, creating a self-contained, reproducible deployment foundation that can be easily migrated to other operating systems and environments.

### Key Principle
All DSH functional state lives on **E:/** (second hard drive), independent of C:/ system drive, enabling:
- **Portability**: Drive can be mounted on any Windows/macOS/Linux system
- **Clean C: Drive**: System drive remains uncluttered
- **Consistent Paths**: E:/ references work across all DSH operations
- **Easy Backup/Migration**: Complete project state in one location

---

## Setup Architecture

```
E:/ (Secondary Hard Drive - DSH Home)
├── Github - Repositories/
│   └── deepseek-harness/          # Main DSH repository
│       ├── apps/                  # Web and CLI applications
│       ├── packages/              # Monorepo workspaces
│       ├── docs/                  # Architecture and docs
│       ├── python/                # Python SDK
│       ├── native/                # Native C++ bindings
│       ├── scripts/               # Build and test scripts
│       ├── .agents/               # Agent workflows
│       ├── vendor/                # Vendored dependencies
│       ├── pnpm-lock.yaml         # Dependency lock file
│       ├── computer_control_mcp.py # MCP server setup
│       ├── mcp.json               # MCP configuration
│       └── .gitignore             # Tracked/ignored patterns
│
└── Build Artifacts & Cache (git-ignored)
    ├── node_modules/              # pnpm workspaces
    ├── lib/                       # Compiled TypeScript
    ├── .pnpm-store-win/          # pnpm cache (Windows)
    ├── .cache/                    # Build cache
    ├── coverage/                  # Test coverage reports
    └── python/**/__pycache__/    # Python bytecode

```

---

## Component Setup Status

### ✅ Source Control Cleanup (Completed)
- **Issue**: Thousands of pnpm cache files (.pnpm-store-win/) tracked in git
- **Resolution**:
  - Removed .pnpm-store-win/ from git index via `git rm -r --cached`
  - Verified .gitignore patterns for ignored files
  - Restored tracked configuration files (computer_control_mcp.py, mcp.json)

### ✅ Configuration Files (Restored & Tracked)

#### computer_control_mcp.py
- **Purpose**: MCP (Model Context Protocol) server setup for DSH
- **Role**: Enables DeepSeek model integration and tool invocation
- **Status**: Tracked in repository, maintained at E:/

#### mcp.json
- **Purpose**: MCP configuration (models, endpoints, credentials)
- **Role**: Runtime configuration for LLM capabilities
- **Status**: Tracked in repository, environment-specific values loaded at runtime

### ✅ Build System (pnpm Monorepo)
- **Package Manager**: pnpm (workspace-aware)
- **Workspaces**: ~50 packages organized by functionality
- **Artifacts**: Generated to E:/ (not tracked in git)
  - `lib/` - Compiled TypeScript
  - `.pnpm-store-win/` - Windows dependency cache
  - `coverage/` - Test coverage

---

## Cross-OS Deployment Strategy

### Windows 10 (Current Environment)
**Primary Development**
- E:/ drive as dedicated DSH volume
- PowerShell 7+ with native Node.js support
- Git bash or native Windows Terminal
- pnpm for dependency management

**Setup Steps:**
```powershell
cd e:\Github - Repositories\deepseek-harness
pnpm install
pnpm run test              # Validate setup
pnpm dsh --profile headless "task"  # Run DSH
```

### macOS Deployment
**Portable Mount Path**
```bash
# Mount E:/ equivalent (USB external drive)
mount /Volumes/DSH-E

# Or clone to local equivalent
git clone <repo> ~/DSH-E
cd ~/DSH-E

pnpm install
pnpm run test
```

**Path Adaptation**: Update references from `e:\` to `/Volumes/` or `~/DSH-E/`

### Linux Deployment
**Portable Mount Path**
```bash
# Mount secondary drive
sudo mount /dev/sdX1 /mnt/dsh-e

# Or clone to equivalent
git clone <repo> ~/dsh-e
cd ~/dsh-e

pnpm install
pnpm run test
```

**Path Adaptation**: Update references from `e:\` to `/mnt/dsh-e/`

---

## Git Ignore Strategy

### Files Always Tracked
```
computer_control_mcp.py     # MCP server setup
mcp.json                    # MCP configuration
pnpm-lock.yaml              # Dependency lock (reproducible installs)
```

### Files Never Tracked (E:/ artifacts)
```
node_modules/               # pnpm workspace dependencies
lib/                        # Compiled TypeScript output
*.tsbuildinfo              # TypeScript incremental builds
.pnpm-store-win/           # Windows-specific pnpm cache
.pnpm-store-debian/        # Linux-specific pnpm cache
coverage/                  # Test coverage (local only)
.cache/                    # Build artifacts
examples/*/.jsonl          # Session recordings
python/**/__pycache__/     # Python compiled modules
apps/web/dist/             # Web build output
.artifacts/                # Temporary build outputs
.dsh-build/                # DSH-specific build state
```

---

## Repository State After Cleanup

### Git Status
```
On branch master
Your branch is up to date with 'origin/master'

Changes to be committed:
  modified:   .gitignore
  new file:   computer_control_mcp.py
  new file:   mcp.json
```

### Source Control Benefits
1. **Reduced Index Size**: Removed ~12,000+ pnpm cache files
2. **Faster Git Operations**: Significantly reduced repository size
3. **Clean History**: Only meaningful changes tracked
4. **Cross-OS Compatibility**: pnpm cache is OS-specific, regenerated on each platform

---

## Deployment Checklist for New OS

When deploying DSH to a new operating system:

- [ ] Clone/mount repository to equivalent location
- [ ] Verify Node.js version: `node --version` (^22.19 || >=24)
- [ ] Verify pnpm: `pnpm --version` (latest)
- [ ] Install dependencies: `pnpm install`
- [ ] Run type check: `pnpm run typecheck`
- [ ] Run unit tests: `pnpm run test`
- [ ] Update path references (e:\ → local equivalent)
- [ ] Configure DEEPSEEK_API_KEY for e2e tests
- [ ] Verify build: `pnpm run build`
- [ ] Test DSH CLI: `pnpm dsh --profile headless "test"`

---

## File Locations & Environment Variables

### Standard E:/ References
```powershell
# Windows PowerShell
$env:DSH_ROOT = "e:\Github - Repositories\deepseek-harness"
cd $env:DSH_ROOT

# Bash/Linux
export DSH_ROOT="/mnt/dsh-e/Github - Repositories/deepseek-harness"
cd $DSH_ROOT
```

### Credentials & Secrets (Not Tracked)
```bash
# Root .env (git-ignored)
DEEPSEEK_API_KEY=sk_...       # DeepSeek LLM API key
DEEPSEEK_BASE_URL=...          # Optional custom endpoint

# Project runs from built lib/ under plain Node
# Source runs through tsx ESM-only hook
```

---

## Next Steps for Full Deployment

1. **Document Platform-Specific Setup**
   - Windows: WSL2 vs native Node behavior
   - macOS: Silicon M1/M2 vs Intel architecture
   - Linux: Debian/Ubuntu vs Alpine vs RHEL variants

2. **Create Automated Setup Script**
   - Cross-platform shell script (bash/powershell)
   - Validates prerequisites
   - Performs pnpm install with retry logic
   - Runs smoke tests

3. **CI/CD Pipeline for Release**
   - Build artifacts for each OS
   - Test on real environments
   - Generate installation packages
   - Publish to npm registry

4. **Documentation Website**
   - Setup guides per OS
   - Troubleshooting common issues
   - Configuration examples
   - Video walkthroughs

---

## Notes

- This setup enables DSH to be a **truly portable project** independent of system drive
- All path references should use **environment-relative** patterns
- Build artifacts are **regenerated** on each platform (npm install on target OS)
- Configuration files (**computer_control_mcp.py**, **mcp.json**) are **version-controlled** for consistency
- Security: Credentials via **.env** (never committed)

---

**Session Date**: 2026-08-30
**Status**: ✅ E:/ Drive Setup Documented & Source Control Resolved
