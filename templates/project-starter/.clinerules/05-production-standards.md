# Production-Grade Code Standards

## Core Principle
> Every line of code must be production-ready. No shortcuts. No placeholder logic.
> Mock data is for tests ONLY — never in source code.

## STRICT: No Mock Data in Production Code
- NEVER use hardcoded mock/fake/placeholder data in `src/` files
- NEVER use `TODO`, `FIXME`, `HACK` without a tracking issue
- NEVER use `console.log` for debugging in committed code
- NEVER leave commented-out code blocks
- NEVER use `as any` without a justification comment

## Error Handling
- Every `try/catch` must handle the error meaningfully
- External API calls MUST have timeout, retry, and meaningful error messages
- NEVER silently swallow errors — at minimum log them

## Code Review Checklist
1. Does this code work with real data, not just test fixtures?
2. Are all error paths handled with meaningful messages?
3. Are there any `any` types without justification?
4. Are external inputs validated?
5. Are there hardcoded values that should be config/constants?
6. Is every TODO tracked with an issue number?
