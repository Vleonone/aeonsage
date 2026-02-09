# AGENTS.md — Universal AI Agent Rules

> This file governs ALL AI assistants working on this project:
> Claude Code, Cursor, GitHub Copilot, Continue.dev, Cline, Windsurf, etc.

## First Steps (AI Onboarding)
1. Run `pnpm onboard --ai` to get project status and key info
2. Read this file + `CLAUDE.md` + `.clinerules/` directory
3. Run `pnpm qa` before making any commit

## Code Standards
- Language: TypeScript ESM (strict mode)
- Runtime: Node.js 22+
- Package manager: pnpm 10+
- Build: tsc | Lint: oxlint | Test: vitest | Format: oxfmt

## Rules (Non-Negotiable)
1. **No mock data in production code** — `src/` files use real data only
2. **No `any`** without justification comment
3. **No empty catch blocks** — always handle errors
4. **No `console.log`** — use logging infrastructure
5. **No hardcoded secrets** — use environment variables
6. **Validate all external input** — Zod schemas at boundaries
7. **Run `pnpm qa` before committing** — all checks must pass

## Commit Convention
```
type(scope): description

Types: feat, fix, refactor, test, docs, chore, perf, security
Scope: module name (e.g., agents, gateway, ui)
```

## When Uncertain
- Read existing code patterns before writing new code
- Check `.clinerules/` for detailed rules on the topic
- If still uncertain, ask the developer rather than guessing
