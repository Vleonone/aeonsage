# Project Onboard Guide

## For Developers

```bash
# 1. Clone the repo
git clone <repo-url> && cd <project>

# 2. One-command bootstrap
pnpm onboard

# 3. Start developing
pnpm dev
```

## For AI Agents

The first command after cloning should be:
```bash
pnpm onboard --ai
```

This outputs a JSON summary with:
- Project name, version, status
- Environment check results (Node, pnpm)
- Build/lint/test results
- Available commands
- Rule files to read

### Recommended AI Agent First Prompt
```
Run `pnpm onboard --ai` and read the output.
Then read CLAUDE.md, AGENTS.md, and .clinerules/ directory.
Report the project status and ask me what to work on.
```

## Available Commands

| Command | Purpose | Time |
|---------|---------|------|
| `pnpm onboard` | First-run bootstrap | ~2min |
| `pnpm fix` | Auto-fix all fixable issues | ~5s |
| `pnpm qa` | Full quality check | ~1-3min |
| `pnpm qa:full` | Auto-fix then full check | ~1-3min |
| `pnpm health` | System diagnostics | ~2min |
| `pnpm health:fast` | Quick diagnostics | ~20s |

## 4-Layer Quality Architecture

```
Layer 1: Save File → Auto-format + CSS fix (0.1s)
Layer 2: Git Commit → Pre-commit hooks auto-lint (3s)
Layer 3: Manual    → pnpm qa (1-3min)
Layer 4: Push/PR   → CI/CD full pipeline (3-5min)
```
