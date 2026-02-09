---
summary: "Configure Baidu Qianfan (ERNIE) as an AI provider"
read_when:
  - You want to use Baidu ERNIE models
  - You need a China-optimized AI provider
  - You are setting up Qianfan API access
---

# Baidu Qianfan (ERNIE)

Baidu Qianfan provides the ERNIE family of models via an OpenAI-compatible
endpoint. This is ideal for users in China or those needing strong Chinese
language capabilities.

Available models:
- `ernie-4.5-8k` — ERNIE 4.5 with 8K context window

## Setup

Set the environment variable:

```bash
export BAIDU_API_KEY="your-api-key"
```

## Config snippet

```json5
{
  env: { BAIDU_API_KEY: "your-api-key" },
  agents: {
    defaults: {
      model: { primary: "baidu/ernie-4.5-8k" },
    },
  },
  models: {
    providers: {
      baidu: {
        api: "openai-responses",
        baseUrl: "https://qianfan.baidubce.com/v2",
        models: [
          { id: "ernie-4.5-8k", name: "ERNIE 4.5 8K", contextWindow: 8192, maxTokens: 4096 },
        ],
      },
    },
  },
}
```

## Notes

- Baidu Qianfan uses Bearer token authentication via the `BAIDU_API_KEY` environment variable
- The API is OpenAI-compatible (responses format)
- Best suited for Chinese language tasks and users in mainland China
- Visit [Baidu Qianfan Console](https://console.bce.baidu.com/qianfan) to obtain API keys
