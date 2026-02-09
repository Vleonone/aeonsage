# AeonsagePro Project Templates

Reusable project configuration templates extracted from AeonsagePro's
production engineering setup.

## Contents

### `project-starter/`
Complete project starter with all quality tools pre-configured:

```
project-starter/
├── .vscode/              ← VS Code settings, tasks, extensions
├── .clinerules/          ← AI agent rules (5 files)
├── .github/
│   ├── workflows/qa.yml  ← CI/CD pipeline
│   └── instructions/     ← Copilot rules
├── .stylelintrc.json     ← CSS linting
├── .cursorrules          ← Cursor IDE rules
├── CLAUDE.md             ← Claude Code rules
├── AGENTS.md             ← Universal AI rules
└── ONBOARD.md            ← Getting started guide
```

## Usage

### New Project
1. Copy `project-starter/` contents to your new project root
2. Replace `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}` in CLAUDE.md
3. Run `pnpm install` and `pnpm onboard`

### Existing Project
Cherry-pick the files you need:
- Want CI/CD? Copy `.github/workflows/qa.yml`
- Want AI rules? Copy `.clinerules/` + `CLAUDE.md` + `AGENTS.md`
- Want VS Code setup? Copy `.vscode/`

## Included Tools

| Category | Tools | Config File |
|----------|-------|-------------|
| Code Quality | oxlint, knip | package.json scripts |
| CSS/UI | Stylelint | .stylelintrc.json |
| Testing | Vitest + V8 coverage | vitest section in package.json |
| Git Hooks | pre-commit (oxfmt + Stylelint) | git-hooks/pre-commit |
| CI/CD | GitHub Actions | .github/workflows/qa.yml |
| AI Rules | Claude, Cursor, Copilot, Cline | CLAUDE.md, .cursorrules, etc. |
| VS Code | 9 recommended extensions | .vscode/extensions.json |

## Commands (add to your package.json)

```json
{
  "scripts": {
    "lint": "oxlint --type-aware src test",
    "lint:css": "stylelint \"src/**/*.css\"",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "qa:check": "pnpm lint && pnpm lint:css",
    "qa:test": "pnpm test:coverage",
    "qa": "pnpm qa:check && pnpm qa:test",
    "fix": "oxlint --type-aware --fix src test && stylelint --fix \"src/**/*.css\"",
    "qa:full": "pnpm fix && pnpm qa",
    "onboard": "node --import tsx scripts/onboard.ts"
  }
}
```
