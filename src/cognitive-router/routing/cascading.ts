import { OracleJudgment } from "../oracle/engine.js";

export enum ModelTier {
    REFLEX = "reflex",
    STANDARD = "standard",
    DEEP = "deep",
}

// Map user intent to specific model IDs
// Priority order: local/free first, then paid APIs
export const TIER_MODEL_MAP = {
    // Tier 1: Instant & Free — Local Ollama + Groq
    [ModelTier.REFLEX]: [
        "ollama:qwen2.5:0.5b",          // Local, zero cost, Oracle classifier
        "ollama:qwen2.5:1.5b",          // Local, zero cost, light inference
        "openrouter:groq/llama-3-8b-8192", // Free API, fast
        "openrouter:google/gemma-7b-it",   // Free API
    ],
    // Tier 2: Standard Balance — KIMI K2.5 + Cost-effective APIs
    [ModelTier.STANDARD]: [
        "nvidia:kimi-k2.5",             // KIMI K2.5 via NVIDIA (free tier)
        "gpt-4o-mini",                  // Low cost
        "claude-3-haiku",               // Low cost
        "gemini-flash",                 // Free tier available
    ],
    // Tier 3: Deep Reasoning — Premium APIs
    [ModelTier.DEEP]: [
        "claude-3-5-sonnet-20240620",   // Best for coding
        "gpt-4o",                       // Best for reasoning
        "openrouter:anthropic/claude-3.5-sonnet", // Fallback
    ],
};

export class CascadingRouter {
    /**
     * Decides the initial model tier based on the Oracle's judgment.
     */
    decideTier(judgment: OracleJudgment | null): ModelTier {
        // Fail-safe: If Oracle is down (null), default to Standard tier.
        if (!judgment) {
            return ModelTier.STANDARD;
        }

        // Direct mapping from Oracle suggestion
        switch (judgment.suggested_tier) {
            case "reflex":
                return ModelTier.REFLEX;
            case "deep":
                return ModelTier.DEEP;
            case "standard":
            default:
                return ModelTier.STANDARD;
        }
    }

    /**
     * Resolves the specific model ID for a given tier.
     * This logic can be expanded to check availability, cost, or user preference.
     */
    resolveModel(tier: ModelTier): string {
        const candidates = TIER_MODEL_MAP[tier];
        // Simple logic: return the first available one. 
        // TODO: Integrate with availability check.
        return candidates[0];
    }
}
