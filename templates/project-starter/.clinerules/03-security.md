# Security Standards

## Red Lines (Non-Negotiable)
- NO hardcoded secrets, API keys, or tokens
- NO `eval()` or `Function()` constructor
- NO string interpolation in database queries
- Validate all file paths before filesystem access
- Validate all URLs before network requests (SSRF protection)

## Input Validation
- All external input validated with Zod at boundaries
- Never trust user input, API responses, or config values without validation

## Dependencies
- Run `pnpm audit` regularly
- Pin critical dependencies
- Review dependency changes in PRs
