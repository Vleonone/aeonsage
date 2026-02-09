---
summary: "Configure Cloudflare AI Gateway as an AI provider"
read_when:
  - You want to route AI requests through Cloudflare
  - You need AI Gateway caching or rate limiting
  - You want to use Workers AI models
---

# Cloudflare AI Gateway

Cloudflare AI Gateway acts as a proxy between AeonSage and upstream AI providers,
adding caching, rate limiting, analytics, and fallback capabilities.

## Setup

Set the environment variables:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_AI_GATEWAY_ID="your-gateway-id"  # optional
```

## Config snippet

```json5
{
  env: {
    CLOUDFLARE_ACCOUNT_ID: "your-account-id",
    CLOUDFLARE_API_TOKEN: "your-api-token",
  },
  models: {
    providers: {
      cloudflare: {
        api: "openai-responses",
        baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1",
        // Or use AI Gateway URL:
        // baseUrl: "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
      },
    },
  },
}
```

## Use Cases

- **Caching**: Reduce costs by caching repeated AI requests
- **Rate Limiting**: Protect against excessive API usage
- **Analytics**: Monitor AI usage across providers
- **Fallback**: Automatic fallback between providers via Gateway rules

## Notes

- Cloudflare AI Gateway supports proxying to OpenAI, Anthropic, Google, and other providers
- Can be combined with Workers AI for edge-deployed models
- Visit [Cloudflare AI Gateway Dashboard](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway) to set up
