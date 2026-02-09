# CLAUDE.md — Claude Code Project Rules

## Project
{{PROJECT_NAME}} — {{PROJECT_DESCRIPTION}} (TypeScript ESM, Node 22+, pnpm 10+)

## Commands
```bash
pnpm build              # TypeScript compile
pnpm lint               # oxlint (type-aware)
pnpm lint:css           # Stylelint (CSS)
pnpm test               # vitest (parallel)
pnpm test:coverage      # with V8 coverage
pnpm qa                 # full quality pipeline
pnpm qa:full            # auto-fix + full pipeline
pnpm fix                # auto-fix all fixable issues
pnpm health             # full system diagnostics
pnpm health:fast        # quick diagnostics
pnpm onboard            # first-run bootstrap
pnpm onboard --ai       # AI agent bootstrap (JSON output)
```

## Production-Grade Standards (ENFORCED)
- NO mock/placeholder/fake data in `src/` files — tests only
- NO `any` without biome-ignore justification
- NO empty catch blocks — handle every error meaningfully
- NO `console.log` — use logging infrastructure
- NO hardcoded secrets/API keys/tokens
- NO TODO/FIXME without tracking issue number
- Every external API call: timeout + retry + error handling
- Test mocks must reflect complete, real API data shapes
- Validate all external input with Zod at system boundaries

## Naming
- Files: kebab-case | Classes: PascalCase | Functions: camelCase
- Import paths: `.js` suffix (NodeNext)

## Security Red Lines
- Validate file paths before filesystem access
- Validate URLs before network requests (SSRF protection)
- No `eval()` or `Function()` constructor
- No hardcoded credentials in any file

## Detailed Rules
See `.clinerules/` for full specifications.
