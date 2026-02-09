# Coding Standards

## Language & Runtime
- TypeScript ESM strict mode (Node.js 22+)
- pnpm 10+ for package management
- `.js` suffix in all import paths (NodeNext resolution)

## Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase` (no `I` prefix)

## File Size
- Maximum 500 lines per file (guideline)
- Break large files into focused modules

## Error Handling
- Every `try/catch` must handle the error meaningfully
- No empty catch blocks
- Use typed error classes for domain errors
- External API calls: timeout + retry + meaningful error messages

## Type Safety
- Avoid `any` — if unavoidable, add justification comment
- Explicit return types for public API functions
- Use discriminated unions over optional fields

## Imports
- External libraries first, then internal modules
- Group by: node builtins → external → internal → relative
