# Testing Standards

## Framework
- vitest with V8 coverage (70% threshold)
- Test files: `*.test.ts` colocated with source

## Rules
- Mock data must reflect complete, realistic API shapes
- Always restore mocks in `afterEach`
- No mock/placeholder data in `src/` files — tests only
- Test edge cases: empty arrays, null values, error paths

## Commands
```bash
pnpm test               # run all tests
pnpm test:watch         # watch mode
pnpm test:coverage      # with coverage report
```
