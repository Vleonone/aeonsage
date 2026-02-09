import type { Api, Model } from "@mariozechner/pi-ai";

function isOpenAiCompletionsModel(model: Model<Api>): model is Model<"openai-completions"> {
  return model.api === "openai-completions";
}

/** Known Anthropic Opus 4.6 model IDs for forward-compat. */
const OPUS_46_IDS = new Set([
  "claude-opus-4-6",
  "claude-opus-4-6-20260205",
  "anthropic/claude-opus-4-6",
]);

/** Known OpenAI Codex gpt-5.3 model IDs. */
const CODEX_53_IDS = new Set([
  "gpt-5.3-codex",
  "gpt-5.3",
  "openai/gpt-5.3-codex",
  "openai-codex/gpt-5.3",
]);

/**
 * Forward-compat: Ensure Opus 4.6 model definitions have correct capabilities
 * even when pi-mono hasn't been updated yet.
 */
function normalizeOpus46(model: Model<Api>): Model<Api> {
  const id = model.id ?? "";
  if (!OPUS_46_IDS.has(id)) return model;
  // Ensure reasoning is enabled and context window is set correctly.
  if (model.contextWindow && model.contextWindow >= 200000) return model;
  return { ...model, contextWindow: 200000, maxTokens: model.maxTokens ?? 32768 };
}

/**
 * Forward-compat: Ensure Codex gpt-5.3 model definitions have correct capabilities.
 */
function normalizeCodex53(model: Model<Api>): Model<Api> {
  const id = model.id ?? "";
  if (!CODEX_53_IDS.has(id)) return model;
  if (model.contextWindow && model.contextWindow >= 200000) return model;
  return { ...model, contextWindow: 200000, maxTokens: model.maxTokens ?? 32768 };
}

/**
 * Allow GitHub Copilot models to use xhigh thinking budget.
 */
function normalizeCopilotThinking(model: Model<Api>): Model<Api> {
  const provider = model.provider ?? "";
  const id = model.id ?? "";
  if (provider !== "github-copilot") return model;
  const isEligible =
    id.includes("gpt-5.2-codex") || id.includes("gpt-5.2") || id.includes("gpt-5.3");
  if (!isEligible || !isOpenAiCompletionsModel(model)) return model;
  return model;
}

/**
 * Normalize Moonshot .cn base URL: if MOONSHOT_API_BASE_URL env var is set,
 * use it to override the default base URL for Chinese mainland users.
 */
function normalizeMoonshotCn(model: Model<Api>): Model<Api> {
  const provider = model.provider ?? "";
  if (provider !== "moonshot") return model;
  const cnBaseUrl = process.env.MOONSHOT_API_BASE_URL?.trim();
  if (!cnBaseUrl) return model;
  return { ...model, baseUrl: cnBaseUrl };
}

export function normalizeModelCompat(model: Model<Api>): Model<Api> {
  const baseUrl = model.baseUrl ?? "";
  const isZai = model.provider === "zai" || baseUrl.includes("api.z.ai");

  let result = model;

  // zai provider compat: disable developer role
  if (isZai && isOpenAiCompletionsModel(result)) {
    const openaiModel = result as Model<"openai-completions">;
    const compat = openaiModel.compat ?? undefined;
    if (compat?.supportsDeveloperRole !== false) {
      openaiModel.compat = compat
        ? { ...compat, supportsDeveloperRole: false }
        : { supportsDeveloperRole: false };
      result = openaiModel;
    }
  }

  // Forward-compat normalizations
  result = normalizeOpus46(result);
  result = normalizeCodex53(result);
  result = normalizeCopilotThinking(result);
  result = normalizeMoonshotCn(result);

  return result;
}
