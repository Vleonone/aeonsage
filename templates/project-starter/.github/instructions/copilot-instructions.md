# GitHub Copilot Instructions

## Project Context
TypeScript ESM project (strict mode, Node.js 22+, pnpm 10+).
Build: tsc | Lint: oxlint | Test: vitest | Format: oxfmt.

## Code Generation Rules
- Generate TypeScript ESM code (import/export, `.js` suffix in paths)
- Use strict typing — avoid `any` unless absolutely necessary
- All functions must handle errors explicitly (no empty catch blocks)
- No `console.log` — use logging infrastructure
- No mock/placeholder data in `src/` files (tests only)
- Validate all external input (Zod at boundaries)

## Testing
- Framework: vitest with V8 coverage (70% threshold)
- Mocks must reflect complete, realistic data shapes

## Style
- Files: kebab-case | Classes: PascalCase | Functions: camelCase
- Max 500 LOC per file (guideline)

## Full Rules
See `.clinerules/` for comprehensive standards.
