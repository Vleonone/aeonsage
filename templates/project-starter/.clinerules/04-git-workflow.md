# Git Workflow

## Commit Convention
```
type(scope): short description

Types: feat | fix | refactor | test | docs | chore | perf | security
```

## Pre-Commit
- Format staged files automatically (oxfmt)
- Lint staged CSS files (Stylelint)
- All automated via git-hooks/pre-commit

## Before Committing
- Run `pnpm qa` to check everything
- Or `pnpm qa:full` to auto-fix first then check

## Branch Strategy
- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — new features
- `fix/*` — bug fixes
