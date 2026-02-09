# Architecture

AeonSage is a **Sovereign Intelligence Operating System** — a complete infrastructure layer for deploying, orchestrating, and governing autonomous AI agents at scale.

## Design Principles

1. **Sovereignty First** — Your agents, your infrastructure, your rules
2. **Enterprise Grade** — Security, compliance, and observability built-in
3. **Multi-Agent Native** — Designed for concurrent agent orchestration from day one
4. **Channel Agnostic** — Unified interface across all communication platforms

## Layered Architecture

```
L5  Automation     — Cron scheduling, webhooks, daemon services, heartbeat monitoring
L4  Intelligence   — Multi-agent orchestration, Workflow Canvas, autonomous delegation
L3  Security       — VDID identity, God Key, Safety Gates, audit logging, path sanitizer
L2  Channels       — Telegram, Discord, Slack, Feishu, LINE, WhatsApp, Signal, iMessage, Web
L1  Gateway        — Event routing, session management, RPC protocol, streaming
L0  Runtime        — Agent execution, sandboxing, tool system, model registry
```

## Source Module Map

### L0: Runtime Layer

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **agents** | `src/agents/` | Core agent tools, model catalog, failover, context management, pi-embedded-runner |
| **runtime** | `src/runtime/` | Runtime adapter factory (PiAgent, future: LangGraph/CrewAI) |
| **process** | `src/process/` | Child process bridge, command queue, exec utilities |
| **node-host** | `src/node-host/` | Node.js script execution runner |
| **canvas-host** | `src/canvas-host/` | Canvas rendering service (A2UI integration) |
| **config** | `src/config/` | Configuration system: parsing, validation, Zod schemas, env vars, legacy migration |
| **sessions** | `src/sessions/` | Session key utilities, model overrides, transcript events |
| **memory** | `src/memory/` | Vector DB, semantic search, embeddings (OpenAI/Gemini/Voyage) |
| **routing** | `src/routing/` | Message routing, session key resolution, channel bindings |

### L1: Gateway Layer

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **gateway** | `src/gateway/` | Central event server: chat, attachments, auth, streaming, webhooks, RPC methods |
| **infra** | `src/infra/` | Binary management, port checking, Bonjour discovery, Docker, diagnostics |
| **logging** | `src/logging/` | Structured logging, console capture, sensitive data redaction |
| **daemon** | `src/daemon/` | System service management: launchd (macOS), schtasks (Windows), systemd |

### L2: Channel Layer

| Module | Path | Platform |
|:-------|:-----|:---------|
| **telegram** | `src/telegram/` | Telegram Bot API with webhooks, media, stickers, video notes |
| **discord** | `src/discord/` | Discord bot with audit, threading, gateway monitoring |
| **slack** | `src/slack/` | Slack Bolt integration with rich messaging and reactions |
| **signal** | `src/signal/` | Signal messenger encrypted messaging |
| **imessage** | `src/imessage/` | Apple iMessage (macOS only) |
| **line** | `src/line/` | LINE with flex messages, rich menus, markdown conversion |
| **feishu** | `src/feishu/` | Feishu/Lark enterprise messaging with webhook security |
| **whatsapp** | `src/whatsapp/` | WhatsApp JID normalization utilities |
| **web** | `src/web/` | WhatsApp Web integration with auto-reply and typing control |
| **channels** | `src/channels/` | Core channel abstraction: config, chat types, ACK reactions, plugin system |

### L3: Security Layer

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **security** | `src/security/` | Tool runner, guardian tools, kill switch, path sanitizer, SSRF protection, encryption |
| **acp** | `src/acp/` | Access Control Protocol |
| **pro** | `src/pro/` | Pro license management |
| **enterprise** | `src/enterprise/` | Enterprise features (security UI, premium skills) |

### L4: Intelligence Layer

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **cognitive-router** | `src/cognitive-router/` | Smart message routing with oracle/prediction system |
| **auto-reply** | `src/auto-reply/` | Reply configuration, command detection, message chunking, group activation |
| **media-understanding** | `src/media-understanding/` | Vision/audio analysis with multi-provider support |
| **link-understanding** | `src/link-understanding/` | URL detection, extraction, formatted output |
| **browser** | `src/browser/` | Chrome automation via CDP/Playwright, stealth mode |
| **tts** | `src/tts/` | Text-to-speech with edge-tts |
| **media** | `src/media/` | Audio/image processing, MIME detection, media server |
| **markdown** | `src/markdown/` | Markdown parsing: code fences, frontmatter, inline tables |

### L5: Automation Layer

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **cron** | `src/cron/` | Cron scheduling, isolation, normalization, run logs |
| **hooks** | `src/hooks/` | Git hooks, email webhooks, Gmail watchers |
| **skills** | `src/skills/` | Skill registry, installer, built-in system skills |
| **marketplace** | `src/marketplace/` | Skill marketplace: crawler, risk assessment, branding |
| **plugins** | `src/plugins/` | Plugin system and runtime |
| **plugin-sdk** | `src/plugin-sdk/` | Plugin development SDK |

### UI & CLI

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **cli** | `src/cli/` | CLI subcommands: agents, channels, config, hooks, models, plugins, skills, update |
| **commands** | `src/commands/` | Agent lifecycle management, auth choices, model configuration |
| **tui** | `src/tui/` | Terminal UI: command handlers, input history, session actions |
| **terminal** | `src/terminal/` | ANSI formatting, avatars, progress indicators, tables, theming |
| **wizard** | `src/wizard/` | Onboarding wizard: gateway/channel setup prompts |
| **i18n** | `src/i18n/` | Internationalization UI utilities |

### Provider Integrations

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **providers** | `src/providers/` | GitHub Copilot, Google, Qwen OAuth adapters |
| **agents/models-config.providers** | `src/agents/` | Anthropic, OpenAI, xAI, Baidu Qianfan, Moonshot, Ollama, Bedrock, OpenRouter, Cloudflare |

### Shared Infrastructure

| Module | Path | Purpose |
|:-------|:-----|:--------|
| **utils** | `src/utils/` | Account ID handling, boolean parsing, delivery context, directives |
| **shared** | `src/shared/` | Shared text utilities |
| **types** | `src/types/` | TypeScript type definitions for external libs |
| **compat** | `src/compat/` | Legacy compatibility name mappings |
| **pairing** | `src/pairing/` | Channel pairing/account linking |
| **macos** | `src/macos/` | macOS-specific gateway daemon relay |
| **docs** | `src/docs/` | Documentation generation (slash commands, terminal CSS) |

## AI Provider Support (v2026.2.9)

| Provider | Models | API |
|:---------|:-------|:----|
| Anthropic | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 | Messages API |
| OpenAI | GPT-5.3-codex, GPT-5.2, GPT-4.1 | Responses API |
| Google | Gemini 2.5 Pro/Flash | Generative Language |
| xAI | Grok 3, Grok 3 Mini | OpenAI-compatible |
| Baidu | ERNIE 4.5 8K | OpenAI-compatible |
| Moonshot | Kimi-K2 | OpenAI-compatible |
| Ollama | Local models | OpenAI-compatible |
| AWS Bedrock | Anthropic/Amazon models | Bedrock SDK |
| OpenRouter | Multi-provider routing | OpenAI-compatible |
| GitHub Copilot | GPT-5.2-codex | Copilot API |
| Cloudflare | Workers AI Gateway | OpenAI-compatible |

## Technology Stack

| Layer | Technology |
|:------|:-----------|
| Runtime | Node.js 22+, TypeScript 5.9 |
| AI Engine | pi-mono 0.52.9 (pi-agent-core, pi-ai, pi-coding-agent, pi-tui) |
| Gateway | Hono 4.11.9, Express 5 |
| Frontend | Lit (Web Components) |
| Mobile | Swift (iOS), Kotlin (Android) |
| Desktop | Swift (macOS) |
| Storage | SQLite (better-sqlite3), sqlite-vec |
| Protocol | WebSocket, HTTP/2 |
| Build | Rolldown, TSC, oxlint, oxfmt |
| Test | Vitest 4, Playwright |

---

For detailed lineage and dependencies, see [NOTICE.md](./NOTICE.md).
