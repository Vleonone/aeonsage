# GitHub Copilot Instructions — AeonsagePro

## Project Context
AeonsagePro is a Sovereign Intelligence Operating System built with TypeScript (ESM, strict mode).
Runtime: Node.js 22+. Package manager: pnpm 10+. Build: tsc. Lint: oxlint. Format: oxfmt. Test: vitest.

## Code Generation Rules
- Generate TypeScript ESM code (import/export, `.js` suffix in paths)
- Use strict typing — avoid `any` unless absolutely necessary
- All functions must handle errors explicitly (no empty catch blocks)
- Use `src/logging/` for logging, never raw `console.log`
- Use existing utilities: `src/terminal/palette.ts` (colors), `src/cli/progress.ts` (spinners)

## Security
- Never hardcode secrets, API keys, or tokens
- Validate all external input (use Zod schemas at boundaries)
- Use `src/security/path-sanitizer.ts` for file paths
- Use `src/infra/net/ssrf.ts` for URL validation

## Testing
- Framework: vitest with V8 coverage (70% threshold)
- Test files: `*.test.ts` colocated with source
- Mocks must reflect complete, realistic data shapes
- Always restore mocks in `afterEach`

## Style
- Product name: **AeonSage** (headings), `aeonsage` (code/CLI)
- Files: kebab-case. Classes: PascalCase. Functions: camelCase
- Max 500 LOC per file (guideline)
- Brief comments for non-obvious logic only

## AI Engine
- pi-mono 0.52.9: Use `AuthStorage` class + `ModelRegistry` class
- Do NOT use deprecated `discoverAuthStorage` / `discoverModels`
- `ToolDefinition.execute` signature: `(toolCallId, params, signal, onUpdate, ctx)`
