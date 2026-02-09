# CLAUDE.md — Claude Code Project Rules

## Project
AeonsagePro — Sovereign Intelligence Operating System (TypeScript ESM, Node 22+, pnpm 10+)

## Commands
```bash
pnpm build              # TypeScript compile
pnpm lint               # oxlint (type-aware)
pnpm test               # vitest (parallel)
pnpm test:coverage      # with V8 coverage
pnpm brand:audit:strict # brand name compliance
pnpm health             # full system diagnostics
pnpm health:fast        # quick diagnostics (skip build/test)
pnpm docs:api           # generate TypeDoc API reference
pnpm dead-code          # find unused exports/dependencies (knip)
pnpm circular           # detect circular dependencies
pnpm cleanup            # scan cleanable caches (dry-run)
```

## Architecture
58 source modules in `src/`, organized L0-L5 (see ARCHITECTURE.md and MODULE-MAP.md).

## Production-Grade Standards (ENFORCED)
- NO mock/placeholder/fake data in `src/` files — tests only
- NO `any` without biome-ignore justification
- NO empty catch blocks — handle every error meaningfully
- NO `console.log` — use `src/logging/` infrastructure
- NO hardcoded secrets/API keys/tokens
- NO TODO/FIXME without tracking issue number
- Every external API call: timeout + retry + error handling
- Test mocks must reflect complete, real API data shapes
- Validate all external input with Zod at system boundaries

## Key API (pi-mono 0.52.9)
- `AuthStorage` class, `ModelRegistry` class (NOT deprecated `discoverAuthStorage`/`discoverModels`)
- `ToolDefinition.execute`: `(toolCallId, params, signal, onUpdate, ctx)`
- `CreateAgentSessionOptions`: no `systemPrompt`/`skills`/`contextFiles`

## Naming
- Product: **AeonSage** | CLI/package: `aeonsage`
- Files: kebab-case | Classes: PascalCase | Functions: camelCase
- Import paths: `.js` suffix (NodeNext)

## Security Red Lines
- Validate file paths via `src/security/path-sanitizer.ts`
- Validate URLs via `src/infra/net/ssrf.ts`
- Hook query tokens are REJECTED
- config.get RPC redacts credential fields
- Skills undergo static analysis before install

## Detailed Rules
See `.clinerules/` for full specifications (7 files covering architecture, coding, testing, security, git, docs, production standards).
For complete repository guidelines, see AGENTS.md.
