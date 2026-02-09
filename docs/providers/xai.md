---
summary: "Configure xAI (Grok) as an AI provider"
read_when:
  - You want to use Grok 3 or Grok 3 Mini
  - You need to set up xAI API key
  - You want an alternative reasoning model
---

# xAI (Grok)

xAI provides the Grok family of models with an OpenAI-compatible endpoint.
Configure the provider with your xAI API key and set the default model.

Available models:
- `grok-3` — Full reasoning model with text and image input
- `grok-3-mini` — Lightweight reasoning model (text only)

## Setup

```bash
aeonsage onboard --auth-choice xai-api-key
```

Or set the environment variable directly:

```bash
export XAI_API_KEY="xai-..."
```

## Config snippet

```json5
{
  env: { XAI_API_KEY: "xai-..." },
  agents: {
    defaults: {
      model: { primary: "xai/grok-3" },
    },
  },
  models: {
    providers: {
      xai: {
        api: "openai-responses",
        baseUrl: "https://api.x.ai/v1",
        models: [
          { id: "grok-3", name: "Grok 3", contextWindow: 131072, maxTokens: 32768 },
          { id: "grok-3-mini", name: "Grok 3 Mini", contextWindow: 131072, maxTokens: 32768 },
        ],
      },
    },
  },
}
```

## Notes

- xAI uses Bearer token authentication via the `XAI_API_KEY` environment variable
- The API is OpenAI-compatible (responses format)
- Grok 3 supports both text and image input; Grok 3 Mini is text only
- Both models support reasoning capabilities
