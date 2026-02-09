# AeonsagePro Onboard Guide

## For Developers

```bash
# 1. Clone the repo
git clone https://github.com/velonone/AeonsagePro.git && cd AeonsagePro

# 2. One-command bootstrap (installs deps, builds, runs checks)
pnpm onboard

# 3. Start developing
pnpm dev
```

## For AI Agents

The **first command** after cloning this project:
```bash
pnpm onboard --ai
```

This outputs a JSON summary with project status, environment info, and key commands.

### Recommended AI Agent First Prompt
```
Run `pnpm onboard --ai` and read the output.
Then read CLAUDE.md, AGENTS.md, and .clinerules/ directory.
Report the project status and ask me what to work on.
```

## Key Commands

| Command | Purpose | Time |
|---------|---------|------|
| `pnpm onboard` | First-run bootstrap | ~2min |
| `pnpm fix` | Auto-fix all fixable issues | ~5s |
| `pnpm qa` | Full quality pipeline (lint + test + audit) | ~1-3min |
| `pnpm qa:full` | Auto-fix then full pipeline | ~1-3min |
| `pnpm health` | Full system diagnostics | ~2min |
| `pnpm health:fast` | Quick diagnostics | ~20s |
| `pnpm cleanup` | Scan cleanable caches (dry-run) | ~5s |

## 4-Layer Quality Architecture

```
Layer 1: Save → Auto-format + CSS fix                (0.1s, zero effort)
Layer 2: Commit → Pre-commit hooks auto-lint          (3s, zero effort)
Layer 3: Manual → pnpm qa                             (1-3min, one command)
Layer 4: Push/PR → CI/CD full pipeline                (3-5min, zero effort)
```

## Rule Files

| File | Read By |
|------|---------|
| `CLAUDE.md` | Claude Code |
| `AGENTS.md` | All AI agents |
| `.clinerules/` | Cline, Continue.dev |
| `.cursorrules` | Cursor IDE |
| `.github/instructions/` | GitHub Copilot |
| `ARCHITECTURE.md` | Everyone (module structure) |
| `MODULE-MAP.md` | Everyone (doc-code alignment) |
