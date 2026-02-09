# Module Map — Documentation ↔ Code Alignment

> Generated: 2026-02-09 | AeonsagePro v2026.2.9
>
> This file maps every source module to its corresponding documentation.
> Use it to identify documentation gaps and keep docs in sync with code.

## Alignment Status Legend

- **ALIGNED** — Documentation exists and matches current code
- **PARTIAL** — Documentation exists but is outdated or incomplete
- **MISSING** — No documentation for this module
- **DOCS-ONLY** — Documentation exists but no corresponding code (aspirational/removed)

---

## L0: Runtime Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| agents | `src/agents/` (294 files) | `docs/concepts/agent.md`, `docs/concepts/agent-loop.md`, `docs/concepts/agent-workspace.md` | ALIGNED |
| runtime | `src/runtime/` (4 files) | `docs/concepts/architecture.md` | PARTIAL — PiAgent adapter not documented |
| process | `src/process/` (9 files) | `docs/capabilities/exec.md` | ALIGNED |
| node-host | `src/node-host/` (3 files) | — | MISSING |
| canvas-host | `src/canvas-host/` (4 files) | — | MISSING |
| config | `src/config/` (123 files) | `CONFIG_GUIDE.md`, `docs/concepts/config.md` | ALIGNED |
| sessions | `src/sessions/` (11 files) | `docs/concepts/sessions.md`, `docs/reference/session-management-compaction.md` | ALIGNED |
| memory | `src/memory/` (34 files) | `docs/concepts/memory.md`, `docs/experiments/research/memory.md` | ALIGNED |
| routing | `src/routing/` (4 files) | `docs/concepts/channel-routing.md` | ALIGNED |

## L1: Gateway Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| gateway | `src/gateway/` (130 files) | `docs/gateway/` (28 files) | ALIGNED |
| infra | `src/infra/` (149 files) | `docs/environment.md`, `docs/network.md` | PARTIAL — SSRF/path sanitizer not documented |
| logging | `src/logging/` (14 files) | `docs/logging.md` | ALIGNED |
| daemon | `src/daemon/` (31 files) | `docs/platforms/` (platform-specific) | PARTIAL — Windows schtasks not documented |

## L2: Channel Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| telegram | `src/telegram/` (79 files) | `docs/channels/telegram.md`, `docs/telegram-config-troubleshooting.md` | ALIGNED |
| discord | `src/discord/` (40 files) | `docs/channels/discord.md` | ALIGNED |
| slack | `src/slack/` (34 files) | `docs/channels/slack.md` | ALIGNED |
| signal | `src/signal/` (22 files) | `docs/channels/signal.md` | ALIGNED |
| imessage | `src/imessage/` (13 files) | `docs/channels/imessage.md` | ALIGNED |
| line | `src/line/` (34 files) | `docs/channels/line.md` | ALIGNED |
| feishu | `src/feishu/` (12 files) | `docs/channels/feishu.md` | ALIGNED |
| whatsapp | `src/whatsapp/` (2 files) | `docs/channels/whatsapp.md` | ALIGNED |
| web | `src/web/` (45 files) | `docs/web/` | ALIGNED |
| channels | `src/channels/` (31 files) | `docs/concepts/channel-routing.md` | PARTIAL — ACK reactions, plugin system undocumented |

## L3: Security Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| security | `src/security/` (33 files) | `docs/security/`, `docs/safety-controls-guide.md`, `SECURITY.md` | PARTIAL — skill-scanner.ts (new) not documented |
| acp | `src/acp/` | — | MISSING |
| pro | `src/pro/` (4 files) | — | MISSING (internal) |
| enterprise | `src/enterprise/` (2 files) | `docs/enterprise/` | PARTIAL |

## L4: Intelligence Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| cognitive-router | `src/cognitive-router/` (6 files) | `docs/concepts/architecture.md` (brief mention) | PARTIAL — oracle system not documented |
| auto-reply | `src/auto-reply/` (70 files) | `docs/capabilities/`, `docs/concepts/messages.md` | ALIGNED |
| media-understanding | `src/media-understanding/` (20 files) | `docs/capabilities/` | ALIGNED |
| link-understanding | `src/link-understanding/` (8 files) | `docs/capabilities/web.md` | PARTIAL |
| browser | `src/browser/` (68 files) | `docs/capabilities/browser.md`, `docs/tools/browser.md` | ALIGNED |
| tts | `src/tts/` (2 files) | `docs/tts.md` | ALIGNED |
| media | `src/media/` (19 files) | — | MISSING |
| markdown | `src/markdown/` (8 files) | — | MISSING |

## L5: Automation Layer

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| cron | `src/cron/` (21 files) | `docs/automation/` | ALIGNED |
| hooks | `src/hooks/` (28 files) | `docs/hooks.md`, `docs/hooks/` | ALIGNED |
| skills | `src/skills/` (6 files) | `docs/capabilities/skills.md`, `docs/tools/skills.md` | ALIGNED |
| marketplace | `src/marketplace/` (9 files) | — | MISSING |
| plugins | `src/plugins/` | `docs/plugins/`, `docs/plugin.md` | ALIGNED |
| plugin-sdk | `src/plugin-sdk/` (2 files) | `docs/plugins/` | PARTIAL — SDK API reference not auto-generated |

## UI & CLI

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| cli | `src/cli/` (105 files) | `docs/cli/` (30 files) | ALIGNED |
| commands | `src/commands/` (181 files) | `docs/cli/` | PARTIAL — auth-choice OAuth flow not documented |
| tui | `src/tui/` (26 files) | `docs/tui.md` | ALIGNED |
| terminal | `src/terminal/` (13 files) | — | MISSING (internal) |
| wizard | `src/wizard/` (9 files) | `docs/wizard.md` | ALIGNED |
| i18n | `src/i18n/` (1 file) | — | MISSING |

## Provider Integrations

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| providers | `src/providers/` (8 files) | `docs/providers/` (24 files) | PARTIAL |
| Anthropic | `src/agents/models-config.providers.ts` | `docs/providers/anthropic.md` | ALIGNED |
| OpenAI | `src/agents/models-config.providers.ts` | `docs/providers/openai.md` | PARTIAL — GPT-5.3-codex not listed |
| xAI (Grok) | `src/agents/models-config.providers.ts` | — | **MISSING** — new provider |
| Baidu Qianfan | `src/agents/models-config.providers.ts` | — | **MISSING** — new provider |
| Moonshot | `src/agents/models-config.providers.ts` | `docs/providers/moonshot.md` | ALIGNED |
| Google | `src/providers/google/` | `docs/providers/google.md` | ALIGNED |
| Ollama | `src/agents/models-config.providers.ts` | `docs/providers/ollama.md` | ALIGNED |
| AWS Bedrock | `src/agents/models-config.providers.ts` | `docs/providers/bedrock.md` | ALIGNED |
| GitHub Copilot | `src/providers/github-copilot/` | `docs/providers/github-copilot.md` | PARTIAL — xhigh thinking not documented |
| Cloudflare | `src/agents/models-config.providers.ts` | — | **MISSING** — new provider |

## Shared Infrastructure

| Module | Source | Documentation | Status |
|:-------|:-------|:--------------|:-------|
| utils | `src/utils/` (13 files) | — | MISSING (internal) |
| shared | `src/shared/` (1 file) | — | MISSING (internal) |
| types | `src/types/` (9 files) | — | MISSING (internal) |
| compat | `src/compat/` (1 file) | — | MISSING (internal) |
| pairing | `src/pairing/` (5 files) | — | MISSING |
| macos | `src/macos/` (4 files) | `docs/platforms/macos.md` | ALIGNED |
| docs | `src/docs/` (2 files) | — | MISSING (internal) |

---

## Summary

| Status | Count | Percentage |
|:-------|------:|:-----------|
| ALIGNED | 32 | 58% |
| PARTIAL | 13 | 24% |
| MISSING | 10 | 18% |

### Priority Actions

1. **New Provider Docs (P0)**: Create `docs/providers/xai.md`, `docs/providers/baidu-qianfan.md`, `docs/providers/cloudflare-ai.md`
2. **Security Updates (P1)**: Document `skill-scanner.ts`, SSRF protection, path sanitizer in security docs
3. **Cognitive Router (P1)**: Expand `docs/concepts/architecture.md` with oracle routing details
4. **Missing Modules (P2)**: Document `canvas-host`, `node-host`, `marketplace`, `media` modules
5. **API Reference (P2)**: TypeDoc auto-generated at `docs/api/` — run `pnpm docs:api`

### Auto-Sync

- **TypeDoc Watch**: `pnpm docs:api:watch` — auto-rebuilds API docs on save
- **Pre-commit Hook**: Regenerates `docs/api/` when `.ts` source files change
- **VS Code Task**: TypeDoc watch starts automatically when project opens
